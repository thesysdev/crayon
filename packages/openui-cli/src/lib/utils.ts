import { CloudAuthMethod } from "../auth/mint";
import { TemplateName } from "../commands/create-app";
import { CreateError, telemetry as defaultTelemetry, type Telemetry } from "./telemetry";

// `handleCliError` is shared by multiple commands, but only create failures
// belong to the ranked create funnel. Keep these props separate so generate
// failures do not get mislabeled as create-flow drop-offs.
const CREATE_FAILURE_FUNNEL_PROPS = {
  funnel: "cli_create",
  funnel_version: "frontloaded_cloud_setup_v1",
  step_rank: "9000",
  step_key: "create_failed",
} as const;

export function handleCliError(
  e: unknown,
  event: string,
  telemetry: Telemetry = defaultTelemetry,
): void {
  const known = e instanceof CreateError;
  const message = e instanceof Error ? e.message : String(e);
  console.error(known ? `Error: ${message}` : message);

  if (event === "cli_create_failed") {
    // Do not send raw create error messages: they can include user-entered
    // project names or paths. The funnel rank is enough to count this drop-off.
    telemetry.capture(event, CREATE_FAILURE_FUNNEL_PROPS);
  } else {
    telemetry.capture(event, {
      stage: known ? e.stage : "unknown",
      error: message.slice(0, 200),
    });
  }

  process.exitCode = 1;
}

export function normalizeTemplate(t?: string): TemplateName | undefined {
  if (!t) return undefined;
  const v = t.toLowerCase();
  if (v === "self-hosted" || v === "openui-self-hosted") return "openui-self-hosted";
  if (v === "cloud" || v === "openui-cloud") return "openui-cloud";
  throw new CreateError(
    "bad_args",
    `unknown template "${t}". Use: openui-self-hosted | openui-cloud.`,
  );
}

export function normalizeAuth(a?: string): CloudAuthMethod | undefined {
  if (!a) return undefined;
  const v = a.toLowerCase();
  if (v === "oauth" || v === "manual" || v === "skip") return v;
  throw new CreateError("bad_args", `unknown --auth "${a}". Use: oauth | manual | skip.`);
}
