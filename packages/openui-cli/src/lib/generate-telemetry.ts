import { captureStageSkipped, instrumentStage, type StageOptions } from "./stage-telemetry";
import type { Telemetry } from "./telemetry";

export type GenerateStage =
  "args_resolution" | "entry_validation" | "worker_execution" | "output_write";

const generateStageRanks: Record<GenerateStage, number> = {
  args_resolution: 100,
  entry_validation: 200,
  worker_execution: 300,
  output_write: 400,
};

export function instrumentGenerateStage<T>(
  stage: GenerateStage,
  operation: () => T | Promise<T>,
  options: StageOptions<T> = {},
): Promise<T> {
  return instrumentStage(
    { event: "cli_generate_stage", stage, rank: generateStageRanks[stage] },
    operation,
    options,
  );
}

export function captureGenerateStageSkipped(
  stage: GenerateStage,
  skipReason: string,
  properties: Record<string, unknown> = {},
  telemetry?: Pick<Telemetry, "capture">,
): void {
  captureStageSkipped(
    { event: "cli_generate_stage", stage, rank: generateStageRanks[stage] },
    skipReason,
    properties,
    telemetry,
  );
}
