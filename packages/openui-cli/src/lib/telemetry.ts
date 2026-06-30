import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { PostHog } from "posthog-node";

// Public ingestion key (same project as docs/coda-prod). Overridable for testing.
const POSTHOG_KEY =
  process.env["OPENUI_POSTHOG_KEY"] ?? "phc_3OLW53x09ZTVZSV6BEpj5uycj3ooqR6KOemOjx04e3D";
const POSTHOG_HOST = process.env["OPENUI_POSTHOG_HOST"] ?? "https://us.i.posthog.com";
const SHUTDOWN_TIMEOUT_MS = 2000;

const isTruthyEnv = (v?: string) => v === "1" || v?.toLowerCase() === "true";
const configDir = () =>
  path.join(process.env["XDG_CONFIG_HOME"] ?? path.join(os.homedir(), ".config"), "openui");
const isCi = () => {
  const e = process.env;
  return isTruthyEnv(e["CI"]) || !!e["GITHUB_ACTIONS"] || !!e["GITLAB_CI"] || !!e["BUILDKITE"];
};

type Stored = { distinctId: string; firstRunNoticeShown?: boolean };

function loadOrCreateState() {
  const file = path.join(configDir(), "telemetry.json");
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf8")) as Stored;
    return {
      distinctId: raw.distinctId,
      isFirstRun: !raw.firstRunNoticeShown,
      persist: () => writeState(file, { ...raw, firstRunNoticeShown: true }),
    };
  } catch {
    /* missing/corrupt → create */
  }
  const fresh: Stored = { distinctId: crypto.randomUUID(), firstRunNoticeShown: false };
  return {
    distinctId: fresh.distinctId,
    isFirstRun: true,
    persist: () => writeState(file, { ...fresh, firstRunNoticeShown: true }),
  };
}
function writeState(file: string, s: Stored) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(s));
  } catch {
    /* read-only fs / CI: best-effort */
  }
}

/** Thrown by command funnels so the index wrapper can attribute the failure stage + drain once. */
export class CreateError extends Error {
  constructor(
    public stage: string,
    message: string,
  ) {
    super(message);
    this.name = "CreateError";
  }
}

export class Telemetry {
  private client?: PostHog;
  private distinctId = "anonymous";
  private superProps: Record<string, unknown> = {};
  private enabled = false;

  init(opts: { cliVersion: string; flagEnabled: boolean }) {
    const optedOut =
      isTruthyEnv(process.env["DO_NOT_TRACK"]) ||
      isTruthyEnv(process.env["OPENUI_TELEMETRY_DISABLED"]) ||
      opts.flagEnabled === false;
    if (optedOut) return; // enabled stays false → all capture() are no-ops
    const state = loadOrCreateState();
    this.distinctId = state.distinctId;
    this.superProps = {
      cli_version: opts.cliVersion,
      os: process.platform,
      os_release: os.release(),
      arch: process.arch,
      node_version: process.version,
      ci: isCi(),
    };
    try {
      this.client = new PostHog(POSTHOG_KEY, {
        host: POSTHOG_HOST,
        flushAt: 1,
        flushInterval: 0,
      });
      // Telemetry is best-effort: swallow network/flush errors so an offline CLI
      // run never spams the user's console with PostHog stack traces.
      this.client.on("error", () => {});
    } catch {
      return;
    }
    this.enabled = true;
    // posthog-core logs flush failures via a hardcoded console.error (not gated on
    // any logger/option). Filter ONLY those lines so an offline run stays quiet —
    // the CLI's own console.error output passes through untouched.
    const origError = console.error.bind(console);
    console.error = (...args: unknown[]) => {
      if (typeof args[0] === "string" && args[0].includes("flushing PostHog")) return;
      origError(...args);
    };
    if (process.env["OPENUI_TELEMETRY_DEBUG"] === "1") this.client.debug();
    if (state.isFirstRun) {
      process.stderr.write(
        "\n◆ OpenUI CLI collects anonymous usage analytics to improve the tool.\n" +
          "  No code, prompts, keys, or personal data are collected.\n" +
          "  Opt out anytime: set DO_NOT_TRACK=1 or pass --no-telemetry.\n\n",
      );
      state.persist();
    }
  }

  register(props: Record<string, unknown>) {
    if (this.enabled) Object.assign(this.superProps, props);
  }

  capture(event: string, properties: Record<string, unknown> = {}) {
    if (!this.enabled || !this.client) return;
    try {
      this.client.capture({
        distinctId: this.distinctId,
        event,
        properties: { ...this.superProps, ...properties },
      });
    } catch {
      /* telemetry must never throw */
    }
  }

  async shutdown() {
    if (!this.enabled || !this.client) return;
    try {
      await Promise.race([
        this.client.shutdown(),
        new Promise<void>((r) => setTimeout(r, SHUTDOWN_TIMEOUT_MS)),
      ]);
    } catch {
      /* swallow */
    }
  }
}

export const telemetry = new Telemetry();
