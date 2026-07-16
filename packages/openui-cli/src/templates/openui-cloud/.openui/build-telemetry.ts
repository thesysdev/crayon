import * as fs from "node:fs";
import { createRequire } from "node:module";
import * as path from "node:path";

const DEFAULT_POSTHOG_KEY = "phc_3OLW53x09ZTVZSV6BEpj5uycj3ooqR6KOemOjx04e3D";
const DEFAULT_POSTHOG_HOST = "https://us.i.posthog.com";
const PROJECT_STATE_PATH = path.join(".openui", "telemetry.json");
const TELEMETRY_SCHEMA_VERSION = 1;
const SEND_TIMEOUT_MS = 1000;
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ProductionCompileContext = {
  distDir: string;
  projectDir: string;
};

type ProjectTelemetryState = {
  schemaVersion?: unknown;
  projectId?: unknown;
};

const isTruthyEnv = (value?: string) => value === "1" || value?.toLowerCase() === "true";

function isCi(): boolean {
  const env = process.env;
  return [env.CI, env.GITHUB_ACTIONS, env.GITLAB_CI, env.BUILDKITE].some(isTruthyEnv);
}

function readProjectId(projectDir: string): string | undefined {
  try {
    const state = JSON.parse(
      fs.readFileSync(path.join(projectDir, PROJECT_STATE_PATH), "utf8"),
    ) as ProjectTelemetryState;

    if (
      state.schemaVersion !== TELEMETRY_SCHEMA_VERSION ||
      typeof state.projectId !== "string" ||
      !UUID_V4_PATTERN.test(state.projectId)
    ) {
      return undefined;
    }

    return state.projectId;
  } catch {
    return undefined;
  }
}

function readNextVersion(projectDir: string): string {
  try {
    const requireFromProject = createRequire(path.join(projectDir, "package.json"));
    const manifestPath = requireFromProject.resolve("next/package.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as { version?: unknown };
    return typeof manifest.version === "string" ? manifest.version : "unknown";
  } catch {
    try {
      const manifest = JSON.parse(
        fs.readFileSync(path.join(projectDir, "package.json"), "utf8"),
      ) as {
        dependencies?: Record<string, unknown>;
        devDependencies?: Record<string, unknown>;
      };
      const declaredVersion = manifest.dependencies?.next ?? manifest.devDependencies?.next;
      return typeof declaredVersion === "string" ? declaredVersion : "unknown";
    } catch {
      return "unknown";
    }
  }
}

/**
 * Reports completion of Next.js production compilation. This is intentionally
 * not named "build succeeded": type checking and static generation run later.
 */
export async function reportOpenUIProductionCompile({
  projectDir,
}: ProductionCompileContext): Promise<void> {
  if (isTruthyEnv(process.env.DO_NOT_TRACK) || isTruthyEnv(process.env.OPENUI_TELEMETRY_DISABLED)) {
    return;
  }

  const projectId = readProjectId(projectDir);
  if (!projectId) return;

  const payload = {
    api_key: process.env.OPENUI_POSTHOG_KEY ?? DEFAULT_POSTHOG_KEY,
    event: "openui_template_production_compile_completed",
    distinct_id: projectId,
    properties: {
      project_id: projectId,
      template: "openui-cloud",
      framework: "nextjs",
      next_version: readNextVersion(projectDir),
      node_major_version: Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10),
      platform: process.platform,
      architecture: process.arch,
      ci: isCi(),
      cloud_key_configured: Boolean(process.env.THESYS_API_KEY?.trim()),
      telemetry_schema_version: TELEMETRY_SCHEMA_VERSION,
      $process_person_profile: false,
      $geoip_disable: true,
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
  try {
    await fetch(new URL("/i/v0/e/", process.env.OPENUI_POSTHOG_HOST ?? DEFAULT_POSTHOG_HOST), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch {
    // Telemetry is best-effort and must never affect or add noise to a build.
  } finally {
    clearTimeout(timeout);
  }
}
