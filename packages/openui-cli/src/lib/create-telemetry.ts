import type { AiSetup, TemplateName } from "./create-types";
import {
  captureStageSkipped,
  instrumentStage,
  type StageOptions,
  type StageTerminalStatus,
} from "./stage-telemetry";
import type { Telemetry } from "./telemetry";

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
  | "skill_prompt"
  | "immediate_prompt"
  | "scaffold"
  | "environment_write"
  | "skill_install"
  | "dependency_install";

export type CreateStageTerminalStatus = StageTerminalStatus;

const createStageRanks: Record<CreateStage, number> = {
  args_resolution: 100,
  preflight: 150,
  environment_resolution: 200,
  cloud_auth: 210,
  skill_prompt: 250,
  immediate_prompt: 260,
  scaffold: 300,
  environment_write: 400,
  skill_install: 510,
  dependency_install: 600,
};

export function instrumentCreateStage<T>(
  stage: CreateStage,
  operation: () => T | Promise<T>,
  options: StageOptions<T> = {},
): Promise<T> {
  return instrumentStage(
    { event: "cli_create_stage", stage, rank: createStageRanks[stage] },
    operation,
    options,
  );
}

export function captureCreateStageSkipped(
  stage: CreateStage,
  skipReason: string,
  properties: Record<string, unknown> = {},
  telemetry?: Pick<Telemetry, "capture">,
): void {
  captureStageSkipped(
    { event: "cli_create_stage", stage, rank: createStageRanks[stage] },
    skipReason,
    properties,
    telemetry,
  );
}
