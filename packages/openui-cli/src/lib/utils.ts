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

/** ASCII Record Separator — Untypeable in prompt text and always
 *  escaped by JSON.stringify, so it can never collide with either artifact. */
export const SEPARATION_DELIMITER = "\u001E";

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

  const failure =
    known && e.telemetryProperties ? e.telemetryProperties : classifyUnknownFailure(e);

  if (event === "cli_create_failed") {
    telemetry.capture(event, {
      ...createFunnelProps("create_failed"),
      failure_stage: known ? e.stage : "unknown",
      ...failure,
    });
  } else {
    telemetry.capture(event, {
      failure_stage: known ? e.stage : "unknown",
      ...failure,
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
    "args_resolution",
    `unknown template "${t}". Use: openui-self-hosted | openui-cloud.`,
    {
      telemetryProperties: {
        failure_category: "invalid_input",
        failure_code: "INVALID_TEMPLATE",
      },
    },
  );
}

export function normalizeAuth(a?: string): CloudAuthMethod | undefined {
  if (!a) return undefined;
  const v = a.toLowerCase();
  if (v === "oauth" || v === "manual" || v === "skip") return v;
  throw new CreateError(
    "args_resolution",
    `unknown --auth "${a}". Use: oauth | skip (manual is deprecated).`,
    {
      telemetryProperties: {
        failure_category: "invalid_input",
        failure_code: "INVALID_AUTH",
      },
    },
  );
}
