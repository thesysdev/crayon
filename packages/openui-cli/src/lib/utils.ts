import type { CloudAuthMethod } from "../auth/mint";
import { createFunnelProps } from "./create-telemetry";
import type { TemplateName } from "./create-types";
import {
  CreateError,
  telemetry as defaultTelemetry,
  type CliErrorClass,
  type Telemetry,
} from "./telemetry";

/** ASCII Record Separator — Untypeable in prompt text and always
 *  escaped by JSON.stringify, so it can never collide with either artifact. */
export const SEPARATION_DELIMITER = "\u001E";

export type CliErrorProperties = {
  failure_stage: string;
  error_class: CliErrorClass;
  error_code: string;
};

const errnoTelemetry: Record<string, Pick<CliErrorProperties, "error_class" | "error_code">> = {
  EACCES: { error_class: "filesystem", error_code: "PERMISSION_DENIED" },
  EPERM: { error_class: "filesystem", error_code: "PERMISSION_DENIED" },
  ENOENT: { error_class: "filesystem", error_code: "NOT_FOUND" },
  ENOSPC: { error_class: "filesystem", error_code: "DISK_FULL" },
};

/** Return only bounded values; never forward an error message or stack. */
export function cliErrorProperties(
  error: unknown,
  fallback: CliErrorProperties = {
    failure_stage: "unknown",
    error_class: "unknown",
    error_code: "UNKNOWN",
  },
): CliErrorProperties {
  if (error instanceof CreateError) {
    return {
      failure_stage: error.stage,
      error_class: error.errorClass,
      error_code: error.errorCode,
    };
  }

  const errno = error instanceof Error ? (error as NodeJS.ErrnoException).code : undefined;
  const classified = errno ? errnoTelemetry[errno] : undefined;
  return classified ? { ...fallback, ...classified } : fallback;
}

export function handleCliError(
  e: unknown,
  event: string,
  telemetry: Telemetry = defaultTelemetry,
): void {
  const message = e instanceof Error ? e.message : String(e);
  console.error(e instanceof CreateError ? `Error: ${message}` : message);

  const errorProperties = cliErrorProperties(e);

  if (event === "cli_create_failed") {
    telemetry.capture(event, {
      ...createFunnelProps("create_failed"),
      ...errorProperties,
    });
  } else {
    telemetry.capture(event, errorProperties);
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
    "invalid_input",
    "INVALID_TEMPLATE",
  );
}

export function normalizeAuth(a?: string): CloudAuthMethod | undefined {
  if (!a) return undefined;
  const v = a.toLowerCase();
  if (v === "oauth" || v === "manual" || v === "skip") return v;
  throw new CreateError(
    "args_resolution",
    `unknown --auth "${a}". Use: oauth | skip (manual is deprecated).`,
    "invalid_input",
    "INVALID_AUTH",
  );
}
