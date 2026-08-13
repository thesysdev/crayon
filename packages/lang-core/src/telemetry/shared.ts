// Browser-safe primitives shared by runtime and installation telemetry.
export const POSTHOG_KEY = "phc_3OLW53x09ZTVZSV6BEpj5uycj3ooqR6KOemOjx04e3D";
export const POSTHOG_HOST = "https://dgoeivjus9jfp.cloudfront.net";
export const TELEMETRY_REQUEST_TIMEOUT_MS = 2_000;
export const TELEMETRY_SCHEMA_VERSION = 1;
export const CI_DETECTION_VERSION = 2;

export type TelemetryEnvironment = Readonly<Record<string, string | undefined>>;

export type RuntimeCiName =
  | "github_actions"
  | "gitlab_ci"
  | "buildkite"
  | "circleci"
  | "jenkins"
  | "travis"
  | "azure_pipelines"
  | "aws_codebuild"
  | "bitbucket_pipelines"
  | "appveyor"
  | "cirrus_ci"
  | "drone"
  | "gitea_actions"
  | "teamcity"
  | "semaphore"
  | "codefresh"
  | "harness"
  | "bitrise"
  | "buddy"
  | "codemagic"
  | "vercel"
  | "netlify"
  | "cloudflare_pages"
  | "cloudflare_workers"
  | "unknown";

interface CiProviderRule {
  name: RuntimeCiName;
  matches: (env: TelemetryEnvironment) => boolean;
}

const RUNTIME_CI_PROVIDERS: ReadonlyArray<CiProviderRule> = [
  { name: "github_actions", matches: (env) => isEnabledEnvValue(env["GITHUB_ACTIONS"]) },
  { name: "gitlab_ci", matches: (env) => isEnabledEnvValue(env["GITLAB_CI"]) },
  { name: "buildkite", matches: (env) => isEnabledEnvValue(env["BUILDKITE"]) },
  { name: "circleci", matches: (env) => isEnabledEnvValue(env["CIRCLECI"]) },
  { name: "travis", matches: (env) => isEnabledEnvValue(env["TRAVIS"]) },
  { name: "azure_pipelines", matches: (env) => isEnabledEnvValue(env["TF_BUILD"]) },
  { name: "aws_codebuild", matches: (env) => isEnabledEnvValue(env["CODEBUILD_BUILD_ARN"]) },
  {
    name: "bitbucket_pipelines",
    matches: (env) =>
      isEnabledEnvValue(env["BITBUCKET_BUILD_NUMBER"]) ||
      isEnabledEnvValue(env["BITBUCKET_COMMIT"]),
  },
  { name: "appveyor", matches: (env) => isEnabledEnvValue(env["APPVEYOR"]) },
  { name: "cirrus_ci", matches: (env) => isEnabledEnvValue(env["CIRRUS_CI"]) },
  { name: "drone", matches: (env) => isEnabledEnvValue(env["DRONE"]) },
  { name: "gitea_actions", matches: (env) => isEnabledEnvValue(env["GITEA_ACTIONS"]) },
  { name: "teamcity", matches: (env) => isEnabledEnvValue(env["TEAMCITY_VERSION"]) },
  { name: "semaphore", matches: (env) => isEnabledEnvValue(env["SEMAPHORE"]) },
  { name: "codefresh", matches: (env) => isEnabledEnvValue(env["CF_BUILD_ID"]) },
  { name: "harness", matches: (env) => isEnabledEnvValue(env["HARNESS_BUILD_ID"]) },
  { name: "bitrise", matches: (env) => isEnabledEnvValue(env["BITRISE_IO"]) },
  { name: "buddy", matches: (env) => isEnabledEnvValue(env["BUDDY_WORKSPACE_ID"]) },
  { name: "codemagic", matches: (env) => isEnabledEnvValue(env["CM_BUILD_ID"]) },
  {
    name: "jenkins",
    matches: (env) =>
      isEnabledEnvValue(env["JENKINS_URL"]) &&
      (isEnabledEnvValue(env["BUILD_ID"]) || isEnabledEnvValue(env["BUILD_NUMBER"])),
  },
];

const HOSTED_BUILD_PROVIDERS: ReadonlyArray<CiProviderRule> = [
  { name: "vercel", matches: (env) => isEnabledEnvValue(env["VERCEL"]) },
  { name: "netlify", matches: (env) => isEnabledEnvValue(env["NETLIFY"]) },
  { name: "cloudflare_pages", matches: (env) => isEnabledEnvValue(env["CF_PAGES"]) },
  {
    name: "cloudflare_workers",
    matches: (env) => isEnabledEnvValue(env["WORKERS_CI"]),
  },
];

const GENERIC_CI_ENV_VARS = ["CI", "CONTINUOUS_INTEGRATION"] as const;

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

export function detectRuntimeCI(env?: TelemetryEnvironment): { ci: boolean; name?: RuntimeCiName } {
  if (!env) return { ci: false };
  if (isExplicitlyDisabledEnvValue(env["CI"])) return { ci: false };

  const genericCI = GENERIC_CI_ENV_VARS.some((key) => isEnabledEnvValue(env[key]));
  const provider =
    RUNTIME_CI_PROVIDERS.find((candidate) => candidate.matches(env)) ??
    (genericCI ? HOSTED_BUILD_PROVIDERS.find((candidate) => candidate.matches(env)) : undefined);

  if (provider) return { ci: true, name: provider.name };
  if (genericCI) return { ci: true, name: "unknown" };
  return { ci: false };
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
  const normalized = value.trim().toLowerCase();
  return normalized !== "0" && normalized !== "false";
}

function isExplicitlyDisabledEnvValue(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === "0" || normalized === "false";
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
