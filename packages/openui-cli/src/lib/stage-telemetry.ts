import { classifyUnknownFailure } from "./error-telemetry";
import {
  CliCancelledError,
  CreateError,
  telemetry as defaultTelemetry,
  type SafeFailureTelemetry,
  type Telemetry,
} from "./telemetry";

export type StageStatus = "started" | "succeeded" | "failed" | "cancelled" | "skipped";
export type StageTerminalStatus = Exclude<StageStatus, "started">;

type TelemetryCapture = Pick<Telemetry, "capture">;

export interface StageOptions<T> {
  properties?: Record<string, unknown>;
  resultProperties?: (result: T) => Record<string, unknown>;
  resultStatus?: (result: T) => StageTerminalStatus;
  errorProperties?: (error: unknown) => Record<string, unknown>;
  telemetry?: TelemetryCapture;
  now?: () => number;
}

interface StageDefinition {
  event: string;
  stage: string;
  rank: number;
  schemaVersion?: number;
}

const stageProperties = (definition: StageDefinition, status: StageStatus) => ({
  stage_schema_version: definition.schemaVersion ?? 1,
  stage: definition.stage,
  stage_rank: definition.rank,
  stage_status: status,
});

const cancellationProperties = (error: CliCancelledError) => ({
  failure_category: "user_cancelled",
  failure_code:
    error.exitCode === 130
      ? "INTERRUPTED"
      : error.exitCode === 143
        ? "TERMINATED"
        : "USER_CANCELLED",
  cancellation_exit_code: error.exitCode,
});

export async function instrumentStage<T>(
  definition: StageDefinition,
  operation: () => T | Promise<T>,
  options: StageOptions<T> = {},
): Promise<T> {
  const telemetry = options.telemetry ?? defaultTelemetry;
  const now = options.now ?? Date.now;
  const startedAt = now();
  telemetry.capture(definition.event, {
    ...options.properties,
    ...stageProperties(definition, "started"),
  });

  try {
    const result = await operation();
    const status = options.resultStatus?.(result) ?? "succeeded";
    telemetry.capture(definition.event, {
      ...options.properties,
      ...options.resultProperties?.(result),
      ...(status === "failed" || status === "cancelled" ? { failure_stage: definition.stage } : {}),
      ...stageProperties(definition, status),
      duration_ms: Math.max(0, now() - startedAt),
    });
    return result;
  } catch (error) {
    const promptCancelled = error instanceof Error && error.name === "ExitPromptError";
    const cancellation =
      error instanceof CliCancelledError
        ? error
        : promptCancelled
          ? new CliCancelledError(definition.stage)
          : undefined;
    const normalized =
      error instanceof CreateError && error.telemetryProperties
        ? error.telemetryProperties
        : classifyUnknownFailure(error);
    const failureProperties = cancellation
      ? cancellationProperties(cancellation)
      : { ...normalized, ...options.errorProperties?.(error) };

    telemetry.capture(definition.event, {
      ...options.properties,
      ...failureProperties,
      failure_stage: definition.stage,
      ...stageProperties(definition, cancellation ? "cancelled" : "failed"),
      duration_ms: Math.max(0, now() - startedAt),
    });

    if (cancellation) throw cancellation;
    if (error instanceof CreateError) throw error;
    throw new CreateError(
      definition.stage,
      error instanceof Error ? error.message : String(error),
      { cause: error, telemetryProperties: failureProperties as SafeFailureTelemetry },
    );
  }
}

export function captureStageSkipped(
  definition: StageDefinition,
  skipReason: string,
  properties: Record<string, unknown> = {},
  telemetry: TelemetryCapture = defaultTelemetry,
): void {
  telemetry.capture(definition.event, {
    ...properties,
    ...stageProperties(definition, "skipped"),
    skip_reason: skipReason,
    duration_ms: 0,
  });
}
