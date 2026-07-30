import {
  captureDemoAgentInteraction,
  type DemoInteractionSource,
} from "../../../lib/demo-analytics";
import { DEFAULT_MODEL } from "../../../lib/openui-cloud/models";
import type { ComparisonMode } from "./comparison-mode-controller";

export type ComparisonPromptSource = Extract<DemoInteractionSource, "composer" | "starter">;

export function captureComparisonPromptInteractions(
  modes: readonly ComparisonMode[],
  interactionSource: ComparisonPromptSource,
): void {
  modes.forEach((mode) => {
    captureDemoAgentInteraction({
      demo: "compare",
      variant: mode,
      model: DEFAULT_MODEL,
      interaction_source: interactionSource,
    });
  });
}

export function captureComparisonRenderedAction(mode: ComparisonMode): void {
  captureDemoAgentInteraction({
    demo: "compare",
    variant: mode,
    model: DEFAULT_MODEL,
    interaction_source: "rendered_action",
  });
}
