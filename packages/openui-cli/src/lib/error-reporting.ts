export type FailureCategory =
  | "command_missing"
  | "disk_space"
  | "engine_mismatch"
  | "http_error"
  | "network"
  | "network_timeout"
  | "package_not_found"
  | "peer_dependency"
  | "permission"
  | "registry_auth"
  | "registry_dns"
  | "user_cancelled"
  | "workspace_config"
  | "unknown";

export type FailureProperties = {
  failure_code: string;
  failure_category: FailureCategory;
  exit_code?: number;
  http_status?: number;
  signal?: string;
};

type ErrorWithProcessDetails = Error & {
  cause?: unknown;
  code?: unknown;
  exitCode?: unknown;
  signal?: unknown;
  status?: unknown;
  stderr?: unknown;
};

const CATEGORY_PATTERNS: ReadonlyArray<{
  category: FailureCategory;
  pattern: RegExp;
}> = [
  {
    category: "peer_dependency",
    pattern: /\b(?:ERR_PNPM_PEER_DEP_ISSUES|ERESOLVE|YN0002|YN0060)\b/i,
  },
  {
    category: "registry_auth",
    pattern: /\b(?:ERR_PNPM_FETCH_(?:401|403)|E401|E403|ENEEDAUTH)\b/i,
  },
  {
    category: "package_not_found",
    pattern: /\b(?:ERR_PNPM_FETCH_404|E404)\b/i,
  },
  { category: "registry_dns", pattern: /\b(?:ENOTFOUND|EAI_AGAIN)\b/i },
  {
    category: "network_timeout",
    pattern: /\b(?:ETIMEDOUT|ESOCKETTIMEDOUT|ERR_SOCKET_TIMEOUT)\b/i,
  },
  {
    category: "network",
    pattern: /\b(?:ECONNREFUSED|ECONNRESET|EHOSTUNREACH|ENETUNREACH|ERR_PNPM_FETCH_[A-Z0-9_]+)\b/i,
  },
  {
    category: "engine_mismatch",
    pattern: /\b(?:EBADENGINE|ERR_PNPM_UNSUPPORTED_ENGINE|YN0009)\b/i,
  },
  { category: "permission", pattern: /\b(?:EACCES|EPERM)\b/i },
  { category: "command_missing", pattern: /\bENOENT\b/i },
  { category: "disk_space", pattern: /\b(?:ENOSPC|EDQUOT)\b/i },
  {
    category: "workspace_config",
    pattern: /\b(?:ERR_PNPM_WORKSPACE_[A-Z0-9_]+|ERR_PNPM_NO_MATCHING_VERSION_INSIDE_WORKSPACE)\b/i,
  },
  { category: "user_cancelled", pattern: /\b(?:SIGINT|ABORT_ERR)\b/i },
];

function asError(error: unknown): ErrorWithProcessDetails | undefined {
  return error instanceof Error ? (error as ErrorWithProcessDetails) : undefined;
}

function asText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Buffer.isBuffer(value)) return value.toString("utf8");
  return "";
}

function diagnosticText(error: unknown, depth = 0): string {
  if (depth > 2) return "";
  const e = asError(error);
  if (!e) return String(error);
  return [e.message, asText(e.stderr), diagnosticText(e.cause, depth + 1)]
    .filter(Boolean)
    .join("\n");
}

function processError(error: unknown, depth = 0): ErrorWithProcessDetails | undefined {
  if (depth > 2) return undefined;
  const e = asError(error);
  if (!e) return undefined;
  if (
    typeof e.exitCode === "number" ||
    typeof e.status === "number" ||
    typeof e.signal === "string" ||
    typeof e.code === "string"
  ) {
    return e;
  }
  return processError(e.cause, depth + 1);
}

function safeFailureCode(text: string, error: ErrorWithProcessDetails | undefined): string {
  const match = text.match(
    /\b(?:ERR_PNPM_[A-Z0-9_]+|ERESOLVE|ENEEDAUTH|E(?:401|403|404)|EAI_AGAIN|E(?:ACCES|BADENGINE|CONNREFUSED|CONNRESET|DQUOT|HOSTUNREACH|NETUNREACH|NOENT|NOSPC|NOTFOUND|PERM|SOCKETTIMEDOUT|TIMEDOUT)|YN\d{4}|ABORT_ERR)\b/i,
  );
  if (match?.[0]) return match[0].toUpperCase();
  if (typeof error?.signal === "string") return error.signal;
  return "UNKNOWN";
}

/**
 * Converts an arbitrary error into an allowlisted, analytics-safe shape.
 * Raw messages and stderr are inspected locally but are never returned.
 */
export function normalizeCliError(error: unknown): FailureProperties {
  const e = processError(error) ?? asError(error);
  const text = diagnosticText(error);
  const signal = typeof e?.signal === "string" ? e.signal : undefined;
  const rawExitCode = e?.exitCode ?? e?.status;
  const exitCode = typeof rawExitCode === "number" ? rawExitCode : undefined;
  const httpStatusMatch = text.match(/\bHTTP\s+([1-5]\d{2})\b/i);
  const httpStatus = httpStatusMatch?.[1] ? Number(httpStatusMatch[1]) : undefined;
  const matchedFailureCode = safeFailureCode(`${text}\n${String(e?.code ?? "")}`, e);
  const failureCode =
    matchedFailureCode === "UNKNOWN" && httpStatus ? `HTTP_${httpStatus}` : matchedFailureCode;
  const matchedCategory =
    signal === "SIGINT"
      ? "user_cancelled"
      : (CATEGORY_PATTERNS.find(({ pattern }) => pattern.test(`${failureCode}\n${text}`))
          ?.category ?? "unknown");
  const category = matchedCategory === "unknown" && httpStatus ? "http_error" : matchedCategory;

  return {
    failure_code: failureCode,
    failure_category: category,
    ...(exitCode === undefined ? {} : { exit_code: exitCode }),
    ...(httpStatus === undefined ? {} : { http_status: httpStatus }),
    ...(signal === undefined ? {} : { signal }),
  };
}
