import { createFunnelProps } from "../lib/create-telemetry";
import { classifyUnknownFailure } from "../lib/error-telemetry";
import { CliCancelledError, CreateError, telemetry } from "../lib/telemetry";
import { Authenticator } from "./authenticator";

// Thesys console OAuth + key mint (same flow as create-c1-app). The OpenUI Cloud
// master key is the same C1-flavored org API key (usageType "C1").
const THESYS_API_URL = "https://api.app.thesys.dev";
const THESYS_ISSUER_URL = "https://api.app.thesys.dev/oidc";
const THESYS_CLIENT_ID = "create-c1-app"; // public PKCE client (no secret)
export const THESYS_KEYS_URL = "https://console.thesys.dev/keys";

export type CloudAuthMethod = "oauth" | "manual" | "skip";
/** How the cloud key was obtained (for telemetry) — auth method + the `--api-key` flag case. */
export type ResolvedAuthMethod = CloudAuthMethod | "apikey-flag";

export type CloudAuthFailureStage =
  | "method_resolution"
  | "manual_key_prompt"
  | "oidc_discovery"
  | "browser_auth"
  | "userinfo"
  | "organization"
  | "key_mint_request"
  | "key_mint_response";

function httpFailureStatus(error: unknown, depth = 0): number | undefined {
  if (depth > 2 || error == null || typeof error !== "object") return undefined;
  const details = error as {
    cause?: unknown;
    httpStatus?: unknown;
    status?: unknown;
    statusCode?: unknown;
  };
  const candidate = details.httpStatus ?? details.status ?? details.statusCode;
  if (typeof candidate === "number" && candidate >= 400 && candidate <= 599) {
    return candidate;
  }
  return httpFailureStatus(details.cause, depth + 1);
}

/** Carries only code-defined fields that are safe to attach to telemetry. */
export class CloudAuthError extends CreateError {
  constructor(
    stage: CloudAuthFailureStage,
    message: string,
    public method?: ResolvedAuthMethod,
    public httpStatus?: number,
    cause?: unknown,
  ) {
    super(stage, message, { cause });
    this.httpStatus = httpStatus ?? httpFailureStatus(cause);
    this.name = "CloudAuthError";
  }
}

export function classifyCloudAuthFailure(error: unknown): Record<string, unknown> {
  const authError = error instanceof CloudAuthError ? error : undefined;
  const failedHttpStatus =
    authError?.httpStatus && authError.httpStatus >= 400
      ? authError.httpStatus
      : httpFailureStatus(error);
  const normalized = classifyUnknownFailure(error);
  const { exit_code: _processExitCode, ...normalizedHttpFailure } = normalized;

  return {
    ...(failedHttpStatus ? normalizedHttpFailure : normalized),
    ...(failedHttpStatus
      ? {
          failure_category: "http_error",
          failure_code: `HTTP_${failedHttpStatus}`,
          http_status: failedHttpStatus,
        }
      : {}),
    failure_stage: authError?.stage ?? "cloud_auth",
    ...(authError?.method ? { auth_method: authError.method } : {}),
    ...(authError?.httpStatus ? { http_status: authError.httpStatus } : {}),
  };
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

async function atCloudAuthStage<T>(
  stage: CloudAuthFailureStage,
  method: ResolvedAuthMethod | undefined,
  action: () => Promise<T>,
  httpStatus?: number,
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof CloudAuthError || error instanceof CliCancelledError) throw error;
    throw new CloudAuthError(stage, errorMessage(error), method, httpStatus, error);
  }
}

function captureAuthMethodSelected(method: ResolvedAuthMethod): void {
  telemetry.capture("cli_cloud_auth_method_selected", {
    ...createFunnelProps("cloud_auth_method_selected"),
    auth_method: method,
  });
}

/** Sign in via the browser and mint an OpenUI Cloud API key for the user's org. */
export async function mintCloudApiKey(projectName: string): Promise<string> {
  const auth = new Authenticator({ issuerUrl: THESYS_ISSUER_URL, clientId: THESYS_CLIENT_ID });
  telemetry.capture("cli_cloud_oidc_started", {
    ...createFunnelProps("cloud_auth_started"),
    auth_method: "oauth",
  });
  await atCloudAuthStage("oidc_discovery", "oauth", () => auth.initialize());
  const { accessToken, userInfo } = await atCloudAuthStage("browser_auth", "oauth", () =>
    auth.authenticate(),
  );

  const { fetchUserInfo } = await import("openid-client");
  const profile = await atCloudAuthStage("userinfo", "oauth", () =>
    fetchUserInfo(
      auth.getClientConfig(),
      accessToken,
      (userInfo?.["sub"] as string | undefined) ?? "",
    ),
  );
  const orgId = (profile["org_claims"] as { orgId: string }[] | undefined)?.[0]?.orgId;
  if (!orgId) {
    throw new CloudAuthError(
      "organization",
      `No organization found for your account. Create a key at ${THESYS_KEYS_URL}.`,
      "oauth",
    );
  }

  console.info("🔑 Creating an OpenUI Cloud API key…");
  const res = await atCloudAuthStage("key_mint_request", "oauth", () =>
    fetch(`${THESYS_API_URL}/application/application.createApiKeyWithOidc`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ name: projectName || "OpenUI Cloud App", orgId, usageType: "C1" }),
    }),
  );
  if (!res.ok) {
    throw new CloudAuthError(
      "key_mint_response",
      `Failed to create API key (HTTP ${res.status}).`,
      "oauth",
      res.status,
    );
  }
  const data = await atCloudAuthStage(
    "key_mint_response",
    "oauth",
    async () => (await res.json()) as { apiKey?: string },
    res.status,
  );
  if (!data.apiKey) {
    throw new CloudAuthError(
      "key_mint_response",
      "The server did not return an API key.",
      "oauth",
      res.status,
    );
  }

  const oidcSub =
    (profile["sub"] as string | undefined) ?? (userInfo?.["sub"] as string | undefined);
  if (oidcSub) telemetry.aliasOidcSubject(oidcSub);

  return data.apiKey;
}

/**
 * Resolve a cloud API key by the chosen method: an explicitly provided key, a
 * browser OAuth mint, a manual paste, or skip (null → leave the .env slot empty).
 */
export async function resolveCloudApiKey(opts: {
  apiKey?: string;
  auth?: CloudAuthMethod;
  projectName: string;
  interactive: boolean;
}): Promise<{ key: string | null; method: ResolvedAuthMethod }> {
  const provided = opts.apiKey?.trim();
  if (provided) {
    captureAuthMethodSelected("apikey-flag");
    return { key: provided, method: "apikey-flag" };
  }

  let method = opts.auth;
  if (!method) {
    if (!opts.interactive) {
      throw new CloudAuthError(
        "method_resolution",
        `An API key is required in non-interactive mode. Pass --api-key <key> ` +
          `(get one at ${THESYS_KEYS_URL}).`,
      );
    }
    try {
      const { select } = await import("@inquirer/prompts");
      method = (await select({
        message: "Connect to OpenUI Cloud:",
        choices: [
          { name: "Sign in with Thesys (opens a browser, mints a key)", value: "oauth" },
          { name: "Paste an existing API key", value: "manual" },
          { name: "Skip — add THESYS_API_KEY to .env later", value: "skip" },
        ],
      })) as CloudAuthMethod;
    } catch (error) {
      const { ExitPromptError } = await import("@inquirer/core");
      if (error instanceof ExitPromptError) {
        throw new CliCancelledError("cloud_auth_method_prompt");
      }
      throw new CloudAuthError("method_resolution", errorMessage(error));
    }
  }

  captureAuthMethodSelected(method);

  if (method === "skip") return { key: null, method: "skip" };

  if (method === "manual") {
    try {
      const { password } = await import("@inquirer/prompts");
      const key = (
        await password({ message: "Paste your OpenUI Cloud API key:", mask: true })
      ).trim();
      return { key: key || null, method: "manual" };
    } catch (error) {
      const { ExitPromptError } = await import("@inquirer/core");
      if (error instanceof ExitPromptError) {
        throw new CliCancelledError("cloud_manual_key_prompt");
      }
      throw new CloudAuthError("manual_key_prompt", errorMessage(error), "manual");
    }
  }

  return { key: await mintCloudApiKey(opts.projectName), method: "oauth" };
}
