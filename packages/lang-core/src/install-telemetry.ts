import { execFileSync } from "node:child_process";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, type WriteFileOptions } from "node:fs";
import { homedir, release } from "node:os";
import path from "node:path";

const POSTHOG_KEY =
  process.env["OPENUI_POSTHOG_KEY"] ?? "phc_3OLW53x09ZTVZSV6BEpj5uycj3ooqR6KOemOjx04e3D";
const POSTHOG_HOST = process.env["OPENUI_POSTHOG_HOST"] ?? "https://dgoeivjus9jfp.cloudfront.net";
const REQUEST_TIMEOUT_MS = 2000;
const TELEMETRY_SCHEMA_VERSION = 1;

export const INSTALL_EVENT = "openui_lang_core_installed";

export type ProjectIdSource = "git_origin" | "repository_url" | "install_root";
export type PackageManagerName = "npm" | "pnpm" | "yarn" | "bun" | "unknown";
export type CiName =
  | "github_actions"
  | "gitlab_ci"
  | "buildkite"
  | "circleci"
  | "vercel"
  | "netlify"
  | "jenkins"
  | "travis";

export interface InstallTelemetryProperties extends Record<string, unknown> {
  telemetry_schema_version: number;
  project_id: string;
  project_id_source: ProjectIdSource;
  lang_core_version: string;
  node_version: string;
  system_platform: string;
  system_release: string;
  system_architecture: string;
  package_manager: PackageManagerName;
  package_manager_version?: string;
  ci: boolean;
  ci_name?: CiName;
  is_docker: boolean;
}

export interface InstallTelemetryPayload {
  distinctId: string;
  event: typeof INSTALL_EVENT;
  properties: InstallTelemetryProperties;
}

export interface InstallTelemetryIO {
  cwd(): string;
  homedir(): string;
  readFile(file: string): string;
  writeFile(file: string, contents: string, options?: WriteFileOptions): void;
  mkdir(directory: string): void;
  getGitOrigin(projectRoot: string): string | undefined;
  platform: string;
  architecture: string;
  release(): string;
  randomUUID(): string;
  randomHex(bytes: number): string;
  isDocker(): boolean;
  stdout(message: string): void;
  stderr(message: string): void;
}

export type InstallTelemetrySender = (
  payload: InstallTelemetryPayload,
  env: NodeJS.ProcessEnv,
) => Promise<void>;

export interface RunInstallTelemetryOptions {
  env?: NodeJS.ProcessEnv;
  io?: Partial<InstallTelemetryIO>;
  send?: InstallTelemetrySender;
}

export type RunInstallTelemetryResult =
  | { status: "disabled" }
  | { status: "debug"; payload: InstallTelemetryPayload }
  | { status: "sent"; payload: InstallTelemetryPayload }
  | { status: "failed"; payload?: InstallTelemetryPayload };

interface StoredTelemetryState extends Record<string, unknown> {
  distinctId: string;
  projectSalt: string;
  langCorePostinstallNoticeShown?: boolean;
}

interface ProjectIdentity {
  value: string;
  source: ProjectIdSource;
}

const INSTALL_NOTICE =
  "\n◆ OpenUI Lang Core sends pseudonymous installation telemetry to PostHog.\n" +
  "  It includes a salted project ID, OpenUI/Node/OS/package-manager metadata, and the network IP observed by PostHog.\n" +
  "  It does not send repository URLs, paths, source code, prompts, errors, or application data.\n" +
  "  Disable it with OPENUI_TELEMETRY_DISABLED=1 or DO_NOT_TRACK=1.\n\n";

export function isTruthyEnv(value?: string): boolean {
  return value === "1" || value?.toLowerCase() === "true";
}

export function isTelemetryDisabled(env: NodeJS.ProcessEnv): boolean {
  return isTruthyEnv(env["OPENUI_TELEMETRY_DISABLED"]) || isTruthyEnv(env["DO_NOT_TRACK"]);
}

export function normalizeProjectIdentity(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  if (/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      if (url.protocol === "file:") {
        return `file:${normalizeRepositoryPath(url.pathname)}`;
      }
      return normalizeHostAndPath(url.host, url.pathname);
    } catch {
      return trimmed.replace(/\/+$/, "").replace(/\.git$/i, "");
    }
  }

  const scpLike = trimmed.match(/^(?:[^@/\s]+@)?([^:/\s]+):(.+)$/);
  if (scpLike) {
    return normalizeHostAndPath(scpLike[1]!, scpLike[2]!);
  }

  return trimmed.replace(/\/+$/, "").replace(/\.git$/i, "");
}

export function hashProjectIdentity(salt: string, projectIdentity: string): string {
  return createHash("sha256").update(salt).update("\0").update(projectIdentity).digest("hex");
}

export function detectPackageManager(env: NodeJS.ProcessEnv): {
  name: PackageManagerName;
  version?: string;
} {
  const userAgent = env["npm_config_user_agent"]?.trim() ?? "";
  const match = userAgent.match(/^(npm|pnpm|yarn|bun)\/([^\s]+)/i);
  if (!match) return { name: "unknown" };

  const name = match[1]!.toLowerCase() as Exclude<PackageManagerName, "unknown">;
  const version = match[2]!.slice(0, 64);
  return version ? { name, version } : { name };
}

export function detectCI(env: NodeJS.ProcessEnv): { ci: boolean; name?: CiName } {
  const providers: Array<[string, CiName]> = [
    ["GITHUB_ACTIONS", "github_actions"],
    ["GITLAB_CI", "gitlab_ci"],
    ["BUILDKITE", "buildkite"],
    ["CIRCLECI", "circleci"],
    ["VERCEL", "vercel"],
    ["NETLIFY", "netlify"],
    ["JENKINS_URL", "jenkins"],
    ["TRAVIS", "travis"],
  ];
  const provider = providers.find(([key]) => {
    const value = env[key];
    return isTruthyEnv(value) || (typeof value === "string" && value.length > 0);
  });
  return {
    ci: Boolean(provider) || isTruthyEnv(env["CI"]),
    ...(provider ? { name: provider[1] } : {}),
  };
}

export async function runInstallTelemetry(
  options: RunInstallTelemetryOptions = {},
): Promise<RunInstallTelemetryResult> {
  const env = options.env ?? process.env;
  if (isTelemetryDisabled(env)) return { status: "disabled" };

  let payload: InstallTelemetryPayload | undefined;
  try {
    const io = createInstallTelemetryIO(options.io);
    const stateFile = getTelemetryStateFile(env, io);
    const state = loadOrCreateState(stateFile, io);
    const projectRoot = path.resolve(env["INIT_CWD"] || io.cwd());
    const projectIdentity = resolveProjectIdentity(projectRoot, env, io);
    const packageManager = detectPackageManager(env);
    const ci = detectCI(env);

    payload = {
      distinctId: state.distinctId,
      event: INSTALL_EVENT,
      properties: {
        telemetry_schema_version: TELEMETRY_SCHEMA_VERSION,
        project_id: hashProjectIdentity(state.projectSalt, projectIdentity.value),
        project_id_source: projectIdentity.source,
        lang_core_version:
          env["OPENUI_LANG_CORE_PACKAGE_VERSION"] || env["npm_package_version"] || "unknown",
        node_version: process.version,
        system_platform: io.platform,
        system_release: io.release(),
        system_architecture: io.architecture,
        package_manager: packageManager.name,
        ...(packageManager.version ? { package_manager_version: packageManager.version } : {}),
        ci: ci.ci,
        ...(ci.name ? { ci_name: ci.name } : {}),
        is_docker: io.isDocker(),
      },
    };

    if (!state.langCorePostinstallNoticeShown) {
      io.stderr(INSTALL_NOTICE);
      state.langCorePostinstallNoticeShown = true;
    }
    persistState(stateFile, state, io);

    if (isTruthyEnv(env["OPENUI_TELEMETRY_DEBUG"])) {
      io.stdout(`[OpenUI telemetry debug]\n${JSON.stringify(payload, null, 2)}\n`);
      return { status: "debug", payload };
    }

    await (options.send ?? sendToPostHog)(payload, env);
    return { status: "sent", payload };
  } catch {
    return { status: "failed", ...(payload ? { payload } : {}) };
  }
}

function normalizeHostAndPath(host: string, repositoryPath: string): string {
  const normalizedHost = host.trim().toLowerCase();
  const normalizedPath = normalizeRepositoryPath(repositoryPath);
  return normalizedPath ? `${normalizedHost}/${normalizedPath}` : normalizedHost;
}

function normalizeRepositoryPath(repositoryPath: string): string {
  return repositoryPath
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.git$/i, "");
}

function createInstallTelemetryIO(overrides: Partial<InstallTelemetryIO> = {}): InstallTelemetryIO {
  return {
    cwd: () => process.cwd(),
    homedir,
    readFile: (file) => readFileSync(file, "utf8"),
    writeFile: (file, contents, options) => writeFileSync(file, contents, options),
    mkdir: (directory) => mkdirSync(directory, { recursive: true, mode: 0o700 }),
    getGitOrigin: defaultGetGitOrigin,
    platform: process.platform,
    architecture: process.arch,
    release,
    randomUUID,
    randomHex: (bytes) => randomBytes(bytes).toString("hex"),
    isDocker: defaultIsDocker,
    stdout: (message) => process.stdout.write(message),
    stderr: (message) => process.stderr.write(message),
    ...overrides,
  };
}

function getTelemetryStateFile(env: NodeJS.ProcessEnv, io: InstallTelemetryIO): string {
  const configRoot = env["XDG_CONFIG_HOME"] || path.join(io.homedir(), ".config");
  return path.join(configRoot, "openui", "telemetry.json");
}

function loadOrCreateState(stateFile: string, io: InstallTelemetryIO): StoredTelemetryState {
  let stored: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(io.readFile(stateFile)) as unknown;
    if (isRecord(parsed)) stored = parsed;
  } catch {
    // Missing or corrupt state is replaced with a new best-effort state.
  }

  return {
    ...stored,
    distinctId:
      typeof stored["distinctId"] === "string" && stored["distinctId"]
        ? stored["distinctId"]
        : io.randomUUID(),
    projectSalt:
      typeof stored["projectSalt"] === "string" && stored["projectSalt"]
        ? stored["projectSalt"]
        : io.randomHex(16),
    langCorePostinstallNoticeShown: stored["langCorePostinstallNoticeShown"] === true,
  };
}

function persistState(
  stateFile: string,
  state: StoredTelemetryState,
  io: InstallTelemetryIO,
): void {
  try {
    io.mkdir(path.dirname(stateFile));
    io.writeFile(stateFile, JSON.stringify(state), { mode: 0o600 });
  } catch {
    // Read-only or ephemeral environments use the in-memory state for this run.
  }
}

function resolveProjectIdentity(
  projectRoot: string,
  env: NodeJS.ProcessEnv,
  io: InstallTelemetryIO,
): ProjectIdentity {
  const gitOrigin = io.getGitOrigin(projectRoot)?.trim();
  if (gitOrigin) {
    return { value: normalizeProjectIdentity(gitOrigin), source: "git_origin" };
  }

  const repositoryUrl = env["REPOSITORY_URL"]?.trim();
  if (repositoryUrl) {
    return {
      value: normalizeProjectIdentity(repositoryUrl),
      source: "repository_url",
    };
  }

  return { value: projectRoot, source: "install_root" };
}

function defaultGetGitOrigin(projectRoot: string): string | undefined {
  try {
    return execFileSync("git", ["-C", projectRoot, "config", "--get", "remote.origin.url"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 1000,
    }).trim();
  } catch {
    return undefined;
  }
}

function defaultIsDocker(): boolean {
  if (existsSync("/.dockerenv")) return true;
  try {
    return /docker|containerd|kubepods/i.test(readFileSync("/proc/self/cgroup", "utf8"));
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function sendToPostHog(
  payload: InstallTelemetryPayload,
  env: NodeJS.ProcessEnv,
): Promise<void> {
  const response = await fetch(new URL("/capture/", env["OPENUI_POSTHOG_HOST"] ?? POSTHOG_HOST), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      api_key: env["OPENUI_POSTHOG_KEY"] ?? POSTHOG_KEY,
      event: payload.event,
      properties: {
        distinct_id: payload.distinctId,
        ...payload.properties,
      },
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) throw new Error(`PostHog capture failed: ${response.status}`);
}
