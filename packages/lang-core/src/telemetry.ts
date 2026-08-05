import type { PromptSpec, ToolSpec } from "./parser/prompt";

const EVENT_NAME = "lang_core_system_prompt_generation_used";
const SAMPLE_RATE = 0.1;
const REQUEST_TIMEOUT_MS = 2_000;
const SDK_VERSION = "0.2.10";
const CAPTURE_URL = "https://us.i.posthog.com/capture/";
const POSTHOG_KEY = "phc_3OLW53x09ZTVZSV6BEpj5uycj3ooqR6KOemOjx04e3D";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type InputShape = "library_spec" | "legacy_prompt_spec";
type Environment = "production" | "development" | "test" | "unknown";
type RuntimeName = "node" | "bun" | "deno" | "edge";

interface ProcessLike {
  cwd?: () => string;
  env?: Record<string, string | undefined>;
  getBuiltinModule?: (specifier: string) => unknown;
  release?: { name?: string };
  versions?: Record<string, string | undefined>;
}

interface RuntimeInfo {
  name: RuntimeName;
  version?: string;
  env?: Record<string, string | undefined>;
  process?: ProcessLike;
}

interface TelemetryState {
  projectHash?: Promise<string | undefined>;
  runtimeId: string;
}

interface CaptureProperties {
  distinct_id: string;
  $process_person_profile: false;
  event_id: string;
  telemetry_schema_version: 1;
  system_prompt_config_hash_version: 1;
  system_prompt_config_hash: string;
  project_hash_version?: 1;
  project_hash?: string;
  component_count: number;
  tool_count: number;
  sdk_name: "@openuidev/lang-core";
  sdk_version: string;
  api_surface: "generate_system_prompt";
  input_shape: InputShape;
  runtime: RuntimeName;
  runtime_version?: string;
  environment: Environment;
  ci: boolean;
  sample_rate: 0.1;
}

const STATE_KEY = Symbol.for("@openuidev/lang-core/telemetry/v1");

function canonicalize(value: unknown): Json {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Non-finite number");
    return value;
  }

  if (Array.isArray(value)) return value.map(canonicalize);

  if (typeof value === "object") {
    const result: Record<string, Json> = {};
    for (const key of Object.keys(value).sort()) {
      const child = (value as Record<string, unknown>)[key];
      if (child !== undefined) result[key] = canonicalize(child);
    }
    return result;
  }

  throw new TypeError(`Unsupported value: ${typeof value}`);
}

function stableJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalTool(tool: string | ToolSpec): Json {
  if (typeof tool === "string") return { kind: "string", value: tool };

  return canonicalize({
    kind: "spec",
    name: tool.name,
    description: tool.description ?? null,
    inputSchema: tool.inputSchema,
    outputSchema: tool.outputSchema,
    annotations: {
      readOnlyHint: tool.annotations?.readOnlyHint ?? null,
      destructiveHint: tool.annotations?.destructiveHint ?? null,
    },
  });
}

export function buildSystemPromptConfigProjection(spec: PromptSpec): Json {
  const hasTools = (spec.tools?.length ?? 0) > 0;
  const toolCalls = spec.toolCalls ?? hasTools;
  const bindings = spec.bindings ?? toolCalls;

  const components = Object.entries(spec.components)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, component]) => ({
      name,
      signature: component.signature,
      description: component.description ?? null,
    }));

  const componentGroups = (spec.componentGroups ?? [])
    .map((group) => ({
      name: group.name,
      components: [...group.components].sort(),
      notes: [...(group.notes ?? [])],
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  const tools = (spec.tools ?? [])
    .map(canonicalTool)
    .sort((left, right) => stableJson(left).localeCompare(stableJson(right)));

  return canonicalize({
    root: spec.root ?? "Root",
    components,
    componentGroups,
    tools,
    modes: {
      toolCalls,
      bindings,
      editMode: spec.editMode === true,
      inlineMode: spec.inlineMode === true,
    },
    preamble: spec.preamble ?? null,
    examples: [...(spec.examples ?? [])],
    toolExamples: [...(spec.toolExamples ?? [])],
    additionalRules: [...(spec.additionalRules ?? [])],
  });
}

async function sha256(value: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("Web Crypto is unavailable");

  const bytes = new TextEncoder().encode(value);
  const digest = await subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function calculateSystemPromptConfigHash(spec: PromptSpec): Promise<string> {
  const canonicalJson = stableJson(buildSystemPromptConfigProjection(spec));
  return sha256(canonicalJson);
}

function getProcess(): ProcessLike | undefined {
  const candidate = (globalThis as typeof globalThis & { process?: unknown }).process;
  if (!candidate || typeof candidate !== "object") return undefined;
  return candidate as ProcessLike;
}

function hasBrowserWindow(): boolean {
  const target = globalThis as typeof globalThis & {
    document?: unknown;
    navigator?: { product?: string };
    window?: unknown;
  };
  return target.navigator?.product === "ReactNative" || Boolean(target.window && target.document);
}

function isBrowserWorker(): boolean {
  const target = globalThis as typeof globalThis & {
    WorkerGlobalScope?: { prototype: object };
  };
  const workerGlobalScope = target.WorkerGlobalScope;
  return Boolean(workerGlobalScope && workerGlobalScope.prototype.isPrototypeOf(globalThis));
}

function detectRuntime(): RuntimeInfo | undefined {
  if (hasBrowserWindow()) return undefined;

  const target = globalThis as typeof globalThis & {
    Bun?: { version?: string };
    Deno?: {
      env?: { get?: (name: string) => string | undefined };
      version?: { deno?: string };
    };
    EdgeRuntime?: unknown;
    WebSocketPair?: unknown;
  };
  const processLike = getProcess();

  if (target.Bun && typeof target.Bun === "object") {
    return {
      name: "bun",
      version: target.Bun.version,
      env: processLike?.env,
      process: processLike,
    };
  }

  if (target.Deno && typeof target.Deno === "object") {
    const env: Record<string, string | undefined> = {};
    try {
      for (const name of ENVIRONMENT_KEYS) env[name] = target.Deno.env?.get?.(name);
    } catch {
      // Deno may deny environment access. Telemetry remains content-free.
    }
    return { name: "deno", version: target.Deno.version?.deno, env };
  }

  if (typeof target.EdgeRuntime === "string") {
    return { name: "edge", version: target.EdgeRuntime };
  }

  if (typeof target.WebSocketPair === "function") {
    return { name: "edge" };
  }

  if (isBrowserWorker()) return undefined;

  if (
    processLike?.release?.name === "node" ||
    (typeof processLike?.versions?.node === "string" && processLike.versions.node.length > 0)
  ) {
    return {
      name: "node",
      version: processLike.versions?.node,
      env: processLike.env,
      process: processLike,
    };
  }

  return undefined;
}

function getEnvironment(env: Record<string, string | undefined> | undefined): Environment {
  const value = env?.NODE_ENV;
  if (value === "production" || value === "development" || value === "test") return value;
  return "unknown";
}

function isTruthyOptOut(value: string | undefined): boolean {
  return value === "1" || value?.toLowerCase() === "true";
}

function isCi(env: Record<string, string | undefined> | undefined): boolean {
  if (!env) return false;
  return [
    "CI",
    "CONTINUOUS_INTEGRATION",
    "BUILD_NUMBER",
    "GITHUB_ACTIONS",
    "GITLAB_CI",
    "BUILDKITE",
    "CIRCLECI",
    "VERCEL",
    "NETLIFY",
  ].some((name) => {
    const value = env[name];
    return Boolean(value && value !== "0" && value.toLowerCase() !== "false");
  });
}

const ENVIRONMENT_KEYS = [
  "NODE_ENV",
  "DO_NOT_TRACK",
  "OPENUI_TELEMETRY_DISABLED",
  "CI",
  "CONTINUOUS_INTEGRATION",
  "BUILD_NUMBER",
  "GITHUB_ACTIONS",
  "GITLAB_CI",
  "BUILDKITE",
  "CIRCLECI",
  "VERCEL",
  "NETLIFY",
] as const;

function getState(): TelemetryState {
  const registry = globalThis as typeof globalThis & { [STATE_KEY]?: TelemetryState };
  registry[STATE_KEY] ??= {
    runtimeId: globalThis.crypto.randomUUID(),
  };
  return registry[STATE_KEY];
}

function normalizeRepositoryIdentifier(rawValue: string): string | undefined {
  const value = rawValue.trim();
  if (!value) return undefined;

  try {
    const url = new URL(value);
    const pathname = decodeURIComponent(url.pathname)
      .replace(/^\/+|\/+$/g, "")
      .replace(/\.git$/i, "");
    if (url.hostname && pathname) return `${url.hostname.toLowerCase()}/${pathname}`;
  } catch {
    // SCP-style Git origins and local paths are handled below.
  }

  if (/^[A-Za-z]:[\\/]/.test(value)) {
    return value.replace(/\\/g, "/").replace(/\/+$/g, "");
  }

  const scpMatch = /^(?:[^@/\s]+@)?([^:/\s]+):(.+)$/.exec(value);
  if (scpMatch) {
    const host = scpMatch[1]?.toLowerCase();
    const pathname = scpMatch[2]?.replace(/^\/+|\/+$/g, "").replace(/\.git$/i, "");
    if (host && pathname) return `${host}/${pathname}`;
  }

  // Local paths are still useful as a last-resort, deployment-local identifier.
  return value.replace(/\\/g, "/").replace(/\/+$/g, "");
}

function readGitOrigin(processLike: ProcessLike): Promise<string | undefined> {
  const childProcess = processLike.getBuiltinModule?.("node:child_process") as
    | {
        execFile?: (
          file: string,
          args: string[],
          options: Record<string, unknown>,
          callback: (error: unknown, stdout?: string) => void,
        ) => unknown;
      }
    | undefined;
  const execFile = childProcess?.execFile;
  if (!execFile) return Promise.resolve(undefined);

  // Repository discovery happens at most once and must never block the event loop.
  return new Promise((resolve) => {
    try {
      execFile(
        "git",
        ["config", "--local", "--get", "remote.origin.url"],
        {
          encoding: "utf8",
          timeout: 500,
          windowsHide: true,
        },
        (error, stdout) => resolve(error ? undefined : stdout),
      );
    } catch {
      resolve(undefined);
    }
  });
}

async function getRepositoryIdentifier(
  processLike: ProcessLike | undefined,
): Promise<string | undefined> {
  if (!processLike) return undefined;

  const rawValue =
    (await readGitOrigin(processLike)) ?? processLike.env?.REPOSITORY_URL ?? processLike.cwd?.();
  return rawValue ? normalizeRepositoryIdentifier(rawValue) : undefined;
}

export function calculateProjectHash(repositoryIdentifier: string): Promise<string> {
  const normalized = normalizeRepositoryIdentifier(repositoryIdentifier);
  if (!normalized) return Promise.reject(new TypeError("Repository identifier is empty"));
  return sha256(normalized);
}

function getProjectHash(state: TelemetryState, runtime: RuntimeInfo): Promise<string | undefined> {
  if (runtime.name !== "node") return Promise.resolve(undefined);

  state.projectHash ??= Promise.resolve()
    .then(() => getRepositoryIdentifier(runtime.process))
    .then((identifier) => (identifier ? calculateProjectHash(identifier) : undefined))
    .catch(() => undefined);
  return state.projectHash;
}

async function sendCapture(
  state: TelemetryState,
  spec: PromptSpec,
  configHash: Promise<string>,
  inputShape: InputShape,
  runtime: RuntimeInfo,
  environment: Environment,
): Promise<void> {
  const [systemPromptConfigHash, projectHash] = await Promise.all([
    configHash,
    getProjectHash(state, runtime),
  ]);

  const properties: CaptureProperties = {
    distinct_id: state.runtimeId,
    $process_person_profile: false,
    event_id: globalThis.crypto.randomUUID(),
    telemetry_schema_version: 1,
    system_prompt_config_hash_version: 1,
    system_prompt_config_hash: systemPromptConfigHash,
    component_count: Object.keys(spec.components).length,
    tool_count: spec.tools?.length ?? 0,
    sdk_name: "@openuidev/lang-core",
    sdk_version: SDK_VERSION,
    api_surface: "generate_system_prompt",
    input_shape: inputShape,
    runtime: runtime.name,
    runtime_version: runtime.version,
    environment,
    ci: isCi(runtime.env),
    sample_rate: SAMPLE_RATE,
    ...(projectHash
      ? {
          project_hash_version: 1 as const,
          project_hash: projectHash,
        }
      : {}),
  };

  const controller = typeof AbortController === "function" ? new AbortController() : undefined;
  const timeout = controller ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS) : undefined;
  (timeout as unknown as { unref?: () => void } | undefined)?.unref?.();

  try {
    await globalThis.fetch(CAPTURE_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event: EVENT_NAME,
        timestamp: new Date().toISOString(),
        properties,
      }),
      keepalive: true,
      signal: controller?.signal,
    });
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export function recordSystemPromptGeneration(spec: PromptSpec, inputShape: InputShape): void {
  try {
    const runtime = detectRuntime();
    if (
      !runtime ||
      typeof globalThis.fetch !== "function" ||
      !globalThis.crypto?.subtle ||
      typeof globalThis.crypto.randomUUID !== "function"
    ) {
      return;
    }

    const env = runtime.env;
    const environment = getEnvironment(env);
    if (isTruthyOptOut(env?.DO_NOT_TRACK) || isTruthyOptOut(env?.OPENUI_TELEMETRY_DISABLED)) {
      return;
    }

    // Reject 90% of calls before projection, hashing, repository lookup, or payload allocation.
    if (Math.random() >= SAMPLE_RATE) return;

    const state = getState();
    const configHash = calculateSystemPromptConfigHash(spec);

    void Promise.resolve()
      .then(() => sendCapture(state, spec, configHash, inputShape, runtime, environment))
      .catch(() => undefined);
  } catch {
    // Telemetry must never affect prompt generation.
  }
}

export function resetTelemetryStateForTests(): void {
  const registry = globalThis as typeof globalThis & { [STATE_KEY]?: TelemetryState };
  delete registry[STATE_KEY];
}
