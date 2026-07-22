import type { CloudAuthMethod } from "../auth/mint";
import { createFunnelProps } from "./create-telemetry";
import type { TemplateName } from "./create-types";
import { normalizeCliError } from "./error-reporting";
import {
  CliCancellation,
  CreateError,
  telemetry as defaultTelemetry,
  type Telemetry,
} from "./telemetry";

export function handleCliError(
  e: unknown,
  event: string,
  telemetry: Telemetry = defaultTelemetry,
): void {
  if (e instanceof CliCancellation) {
    console.info("Cancelled.");
    const cancellationEvent = event.replace(/_failed$/, "_cancelled");
    telemetry.capture(cancellationEvent, {
      ...(event === "cli_create_failed" ? createFunnelProps("create_cancelled") : {}),
      cancel_stage: e.stage,
      failure_code: "USER_CANCELLED",
      failure_category: "user_cancelled",
    });
    process.exitCode = 0;
    return;
  }

  const known = e instanceof CreateError;
  const message = e instanceof Error ? e.message : String(e);
  console.error(known ? `Error: ${message}` : message);

  if (event === "cli_create_failed") {
    // Do not send raw create error messages: they can include user-entered
    // project names or paths. Only normalized diagnostics leave the process.
    telemetry.capture(event, {
      ...createFunnelProps("create_failed"),
      failure_stage: known ? e.stage : "unknown",
      ...normalizeCliError(e),
    });
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
