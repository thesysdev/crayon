import type { CloudAuthMethod } from "../auth/mint";
import { createFunnelProps } from "./create-telemetry";
import type { TemplateName } from "./create-types";
import { classifyUnknownFailure } from "./error-telemetry";
import {
  CliCancelledError,
  CreateError,
  telemetry as defaultTelemetry,
  type Telemetry,
} from "./telemetry";

export function handleCliError(
  e: unknown,
  event: string,
  telemetry: Telemetry = defaultTelemetry,
): void {
  if (e instanceof CliCancelledError) {
    console.info("Cancelled.");
    const cancelledEvent = event.endsWith("_failed")
      ? `${event.slice(0, -"_failed".length)}_cancelled`
      : `${event}_cancelled`;
    telemetry.capture(
      cancelledEvent,
      event === "cli_create_failed"
        ? {
            ...createFunnelProps("create_cancelled"),
            cancellation_stage: e.stage,
            cancellation_exit_code: e.exitCode,
          }
        : { cancellation_stage: e.stage, cancellation_exit_code: e.exitCode },
    );
    process.exitCode = e.exitCode;
    return;
  }

  const known = e instanceof CreateError;
  const message = e instanceof Error ? e.message : String(e);
  console.error(known ? `Error: ${message}` : message);

  if (event === "cli_create_failed") {
    // Do not send raw create error messages: they can include user-entered
    // project names or paths. CreateError stages are code-defined and safe.
    telemetry.capture(event, {
      ...createFunnelProps("create_failed"),
      failure_stage: known ? e.stage : "unknown",
      ...(known && e.telemetryProperties ? e.telemetryProperties : classifyUnknownFailure(e)),
    });
  } else {
    telemetry.capture(event, {
      stage: known ? e.stage : "unknown",
      ...classifyUnknownFailure(e),
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
