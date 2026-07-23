import type { AiSetup, TemplateName } from "./create-types";
import { classifyUnknownFailure } from "./error-telemetry";
import {
  CliCancelledError,
  CreateError,
  telemetry as defaultTelemetry,
  type Telemetry,
} from "./telemetry";

const createFunnel = {
  funnel: "cli_create",
  funnel_version: "frontloaded_cloud_setup_v1",
} as const;

const createFunnelSteps = {
  create_started: "0100",
  ai_setup_selected: "0200",
  scaffold_started: "0300",
  scaffold_succeeded: "0310",
  scaffold_failed: "0320",
  env_resolution_started: "0400",
  cloud_auth_started: "0410",
  cloud_auth_method_selected: "0415",
  cloud_auth_resolved: "0420",
  cloud_auth_failed: "0425",
  env_written: "0430",
  skill_prompt_resolved: "0500",
  skill_install_started: "0510",
  skill_install_finished: "0520",
  skill_install_succeeded: "0525",
  skill_install_failed: "0530",
  skill_install_cancelled: "0540",
  dependency_install_started: "0600",
  dependency_install_succeeded: "0610",
  dependency_install_failed: "0620",
  dependency_install_cancelled: "0630",
  create_succeeded: "0700",
  create_failed: "9000",
  create_cancelled: "9010",
} as const;

type CreateFunnelStep = keyof typeof createFunnelSteps;

export function createFunnelProps(stepKey: CreateFunnelStep): Record<string, string> {
  return {
    ...createFunnel,
    step_rank: createFunnelSteps[stepKey],
    step_key: stepKey,
  };
}

export function aiSetupFromTemplate(template: TemplateName): AiSetup {
  return template === "openui-cloud" ? "openui_cloud" : "openai_compatible_provider";
}

export type CreateStage =
  | "args_resolution"
  | "preflight"
  | "environment_resolution"
  | "cloud_auth"
  | "scaffold"
  | "environment_write"
  | "skill_prompt"
  | "skill_install"
  | "dependency_install";

export type CreateStageStatus = "started" | "succeeded" | "failed" | "cancelled" | "skipped";
type CreateStageTerminalStatus = Exclude<CreateStageStatus, "started">;

const createStageRanks: Record<CreateStage, number> = {
  args_resolution: 100,
  preflight: 150,
  environment_resolution: 200,
  cloud_auth: 210,
  scaffold: 300,
  environment_write: 400,
  skill_prompt: 500,
  skill_install: 510,
  dependency_install: 600,
};

type TelemetryCapture = Pick<Telemetry, "capture">;

interface StageOptions<T> {
  properties?: Record<string, unknown>;
  resultProperties?: (result: T) => Record<string, unknown>;
  resultStatus?: (result: T) => CreateStageTerminalStatus;
  errorProperties?: (error: unknown) => Record<string, unknown>;
  telemetry?: TelemetryCapture;
  now?: () => number;
}

const stageProperties = (stage: CreateStage, status: CreateStageStatus) => ({
  funnel: createFunnel.funnel,
  funnel_version: createFunnel.funnel_version,
  stage_schema_version: 1,
  stage,
  stage_rank: createStageRanks[stage],
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

/**
 * Emits one canonical lifecycle event around a create operation. Existing
 * funnel events remain intact; this event is for stage conversion and latency
 * benchmarks with consistent status, rank, and duration fields.
 */
export async function instrumentCreateStage<T>(
  stage: CreateStage,
  operation: () => T | Promise<T>,
  options: StageOptions<T> = {},
): Promise<T> {
  const telemetry = options.telemetry ?? defaultTelemetry;
  const now = options.now ?? Date.now;
  const startedAt = now();
  telemetry.capture("cli_create_stage", {
    ...options.properties,
    ...stageProperties(stage, "started"),
  });

  try {
    const result = await operation();
    const status = options.resultStatus?.(result) ?? "succeeded";
    telemetry.capture("cli_create_stage", {
      ...options.properties,
      ...options.resultProperties?.(result),
      ...(status === "failed" || status === "cancelled" ? { failure_stage: stage } : {}),
      ...stageProperties(stage, status),
      duration_ms: Math.max(0, now() - startedAt),
    });
    return result;
  } catch (error) {
    const promptCancelled = error instanceof Error && error.name === "ExitPromptError";
    const cancellation =
      error instanceof CliCancelledError
        ? error
        : promptCancelled
          ? new CliCancelledError(stage)
          : undefined;
    telemetry.capture("cli_create_stage", {
      ...options.properties,
      ...(cancellation
        ? cancellationProperties(cancellation)
        : {
            ...(error instanceof CreateError && error.telemetryProperties
              ? error.telemetryProperties
              : classifyUnknownFailure(error)),
            ...options.errorProperties?.(error),
          }),
      failure_stage:
        error instanceof CreateError || error instanceof CliCancelledError ? error.stage : stage,
      ...stageProperties(stage, cancellation ? "cancelled" : "failed"),
      duration_ms: Math.max(0, now() - startedAt),
    });

    if (cancellation) throw cancellation;
    if (error instanceof CreateError) throw error;
    throw new CreateError(stage, error instanceof Error ? error.message : String(error), {
      cause: error,
    });
  }
}

export function captureCreateStageSkipped(
  stage: CreateStage,
  skipReason: string,
  properties: Record<string, unknown> = {},
  telemetry: TelemetryCapture = defaultTelemetry,
): void {
  telemetry.capture("cli_create_stage", {
    ...properties,
    ...stageProperties(stage, "skipped"),
    skip_reason: skipReason,
    duration_ms: 0,
  });
}
