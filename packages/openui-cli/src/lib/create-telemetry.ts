import type { AiSetup, TemplateName } from "./create-types";
import { normalizeCliError } from "./error-reporting";
import { CliCancellation, CreateError, telemetry as defaultTelemetry } from "./telemetry";

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
  cloud_auth_resolved: "0420",
  env_written: "0430",
  skill_prompt_resolved: "0500",
  skill_install_started: "0510",
  skill_install_finished: "0520",
  dependency_install_started: "0600",
  dependency_install_succeeded: "0610",
  dependency_install_failed: "0620",
  create_succeeded: "0700",
  create_failed: "9000",
  create_cancelled: "9100",
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
  | "cloud_auth"
  | "dependency_install"
  | "environment_resolution"
  | "environment_write"
  | "preflight"
  | "scaffold"
  | "skill_install"
  | "skill_prompt";

export type CreateStageStatus = "started" | "succeeded" | "failed" | "cancelled" | "skipped";

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

type TelemetryCapture = Pick<typeof defaultTelemetry, "capture">;

type StageOptions<T> = {
  properties?: Record<string, unknown>;
  resultProperties?: (result: T) => Record<string, unknown>;
  resultStatus?: (result: T) => Extract<CreateStageStatus, "succeeded" | "skipped">;
  telemetry?: TelemetryCapture;
  now?: () => number;
};

const stageProperties = (stage: CreateStage, status: CreateStageStatus) => ({
  funnel: createFunnel.funnel,
  funnel_version: createFunnel.funnel_version,
  stage_schema_version: 1,
  stage,
  stage_rank: createStageRanks[stage],
  stage_status: status,
});

/**
 * Emits a uniform lifecycle event around a create operation. This is the canonical
 * event for stage conversion and latency benchmarks; the older funnel events remain compatible.
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
      ...stageProperties(stage, status),
      duration_ms: Math.max(0, now() - startedAt),
    });
    return result;
  } catch (error) {
    const promptCancelled = error instanceof Error && error.name === "ExitPromptError";
    const cancelled = error instanceof CliCancellation || promptCancelled;
    const failure = cancelled
      ? ({
          failure_code: "USER_CANCELLED",
          failure_category: "user_cancelled",
        } as const)
      : normalizeCliError(error);
    telemetry.capture("cli_create_stage", {
      ...options.properties,
      ...stageProperties(stage, cancelled ? "cancelled" : "failed"),
      duration_ms: Math.max(0, now() - startedAt),
      failure_stage:
        error instanceof CreateError || error instanceof CliCancellation ? error.stage : stage,
      ...failure,
    });
    if (error instanceof CreateError || error instanceof CliCancellation) throw error;
    if (promptCancelled) throw new CliCancellation(stage);
    const message = error instanceof Error ? error.message : String(error);
    throw new CreateError(stage, message, { cause: error });
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
