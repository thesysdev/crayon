import type { Definition } from "./schemas";

// The shape of a kit's metric registry: every metric its tools return, defined
// once. Tools attach the definition to each KPI (shown when hovering its
// value), and the system prompt's glossary is generated from the same list.

export interface MetricDefinition extends Definition {
  label: string;
  /** Whether an increase is good news; defaults to up. */
  goodDirection?: "up" | "down" | "neutral";
  /**
   * Leave it out of the prompt's glossary when the tool that returns it
   * already says what it is; its definition still shows on hover.
   */
  glossary?: false;
}

/** The definition a KPI carries, without its label. */
export function definitionOf(metric: MetricDefinition): Definition {
  const { formula, window, basis } = metric;
  return { formula, window, ...(basis ? { basis } : {}) };
}

/** One clause per metric for the system prompt: "Average order value = (Gross sales − discounts) ÷ orders". */
export function glossary(metrics: Record<string, MetricDefinition>): string {
  const lines = new Map<string, string>();
  for (const { label, formula, glossary } of Object.values(metrics)) {
    if (glossary !== false && !lines.has(label)) lines.set(label, `${label} = ${formula}`);
  }
  return [...lines.values()].join("; ");
}
