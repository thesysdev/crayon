// Browser-safe primitives shared by runtime and installation telemetry.
export const POSTHOG_KEY = "phc_3OLW53x09ZTVZSV6BEpj5uycj3ooqR6KOemOjx04e3D";
export const POSTHOG_HOST = "https://dgoeivjus9jfp.cloudfront.net";
export const TELEMETRY_REQUEST_TIMEOUT_MS = 2_000;
export const TELEMETRY_SCHEMA_VERSION = 1;

export type TelemetryEnvironment = Readonly<Record<string, string | undefined>>;

export type CiName =
  | "github_actions"
  | "gitlab_ci"
  | "buildkite"
  | "circleci"
  | "vercel"
  | "netlify"
  | "jenkins"
  | "travis";

const CI_PROVIDERS: ReadonlyArray<readonly [string, CiName]> = [
  ["GITHUB_ACTIONS", "github_actions"],
  ["GITLAB_CI", "gitlab_ci"],
  ["BUILDKITE", "buildkite"],
  ["CIRCLECI", "circleci"],
  ["VERCEL", "vercel"],
  ["NETLIFY", "netlify"],
  ["JENKINS_URL", "jenkins"],
  ["TRAVIS", "travis"],
];

const GENERIC_CI_ENV_VARS = ["CI", "CONTINUOUS_INTEGRATION", "BUILD_NUMBER"] as const;

export function getPostHogConfig(env?: TelemetryEnvironment): {
  apiKey: string;
  captureUrl: string;
} {
  const host = env?.["OPENUI_POSTHOG_HOST"] ?? POSTHOG_HOST;
  return {
    apiKey: env?.["OPENUI_POSTHOG_KEY"] ?? POSTHOG_KEY,
    captureUrl: new URL("/capture/", host).toString(),
  };
}

export function isTruthyEnv(value?: string): boolean {
  return value === "1" || value?.toLowerCase() === "true";
}

export function isTelemetryDisabled(env?: TelemetryEnvironment): boolean {
  return isTruthyEnv(env?.["OPENUI_TELEMETRY_DISABLED"]) || isTruthyEnv(env?.["DO_NOT_TRACK"]);
}

export function detectCI(env?: TelemetryEnvironment): { ci: boolean; name?: CiName } {
  if (!env) return { ci: false };

  const provider = CI_PROVIDERS.find(([key]) => isEnabledEnvValue(env[key]));
  return {
    ci: Boolean(provider) || GENERIC_CI_ENV_VARS.some((key) => isEnabledEnvValue(env[key])),
    ...(provider ? { name: provider[1] } : {}),
  };
}

export function normalizeProjectIdentity(rawValue: string): string {
  const value = rawValue.trim();
  if (!value) return "";

  try {
    const url = new URL(value);
    const repositoryPath = normalizeRepositoryPath(decodeURIComponent(url.pathname));
    if (url.protocol === "file:") return `file:${repositoryPath}`;
    if (url.host) return joinHostAndPath(url.host, repositoryPath);
  } catch {
    // SCP-style Git origins and local paths are handled below.
  }

  if (/^[A-Za-z]:[\\/]/.test(value)) return normalizeRepositoryPath(value);

  const scpMatch = /^(?:[^@/\s]+@)?([^:/\s]+):(.+)$/.exec(value);
  if (scpMatch) return joinHostAndPath(scpMatch[1]!, scpMatch[2]!);

  return normalizeRepositoryPath(value);
}

function isEnabledEnvValue(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return normalized !== "0" && normalized !== "false";
}

function joinHostAndPath(host: string, repositoryPath: string): string {
  const normalizedHost = host.trim().toLowerCase();
  const normalizedPath = normalizeRepositoryPath(repositoryPath);
  return normalizedPath ? `${normalizedHost}/${normalizedPath}` : normalizedHost;
}

function normalizeRepositoryPath(repositoryPath: string): string {
  return repositoryPath
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.git$/i, "");
}
