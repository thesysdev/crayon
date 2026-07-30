import { analytics } from "./analytics";
import { DEMO_MODEL_IDS } from "./demo-models";

export const DEMO_AGENT_INTERACTION_EVENT = "demo_agent_interaction";

export const DEMO_AGENT_INTERACTION_DEMOS = [
  "compare",
  "github_dashboard",
  "openui_chat",
  "openui_vs_json",
] as const;

export const DEMO_INTERACTION_SOURCES = ["composer", "starter", "rendered_action"] as const;

export type DemoAgentInteractionDemo = (typeof DEMO_AGENT_INTERACTION_DEMOS)[number];
export type DemoInteractionSource = (typeof DEMO_INTERACTION_SOURCES)[number];

export interface DemoAgentInteraction {
  demo: DemoAgentInteractionDemo;
  variant?: string;
  model: string;
  interaction_source: DemoInteractionSource;
}

export type DemoAgentInteractionProperties = DemoAgentInteraction;

const DEMO_AGENT_INTERACTION_DEMO_SET = new Set<string>(DEMO_AGENT_INTERACTION_DEMOS);
const DEMO_INTERACTION_SOURCE_SET = new Set<string>(DEMO_INTERACTION_SOURCES);
const DEMO_VARIANTS: Record<DemoAgentInteractionDemo, ReadonlySet<string>> = {
  compare: new Set(["markdown", "oss", "cloud"]),
  github_dashboard: new Set(),
  openui_chat: new Set(["oss", "cloud"]),
  openui_vs_json: new Set(),
};
const DEMO_MODELS: Record<DemoAgentInteractionDemo, ReadonlySet<string>> = {
  compare: new Set(DEMO_MODEL_IDS.compare),
  github_dashboard: new Set(DEMO_MODEL_IDS.github_dashboard),
  openui_chat: new Set(DEMO_MODEL_IDS.openui_chat),
  openui_vs_json: new Set(DEMO_MODEL_IDS.openui_vs_json),
};

/**
 * Builds the complete PostHog payload from an allowlist of low-cardinality
 * fields. Unknown fields on a structurally compatible input are not forwarded.
 */
export function getDemoAgentInteractionProperties(
  interaction: DemoAgentInteraction,
): DemoAgentInteractionProperties | null {
  if (
    !interaction ||
    typeof interaction !== "object" ||
    !DEMO_AGENT_INTERACTION_DEMO_SET.has(interaction.demo) ||
    !DEMO_INTERACTION_SOURCE_SET.has(interaction.interaction_source) ||
    typeof interaction.model !== "string" ||
    !DEMO_MODELS[interaction.demo].has(interaction.model)
  ) {
    return null;
  }

  const variant =
    typeof interaction.variant === "string" &&
    DEMO_VARIANTS[interaction.demo].has(interaction.variant)
      ? interaction.variant
      : undefined;

  return {
    demo: interaction.demo,
    ...(variant ? { variant } : {}),
    model: interaction.model,
    interaction_source: interaction.interaction_source,
  };
}

/**
 * Records a user interaction without delaying or affecting the interaction.
 * Server rendering and malformed inputs intentionally become no-ops.
 */
export function captureDemoAgentInteraction(interaction: DemoAgentInteraction): void {
  const properties = getDemoAgentInteractionProperties(interaction);
  if (!properties || typeof window === "undefined") return;

  try {
    analytics.capture(DEMO_AGENT_INTERACTION_EVENT, properties);
  } catch {
    // Analytics must never interfere with the user action being measured.
  }
}
