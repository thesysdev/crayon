import type { ToolSpec } from "@openuidev/lang-core";
import { z } from "zod/v4";

/** A read-only data tool a kit's dashboards can call with Query(). */
export interface KitTool<
  N extends string = string,
  I extends z.ZodObject = z.ZodObject,
  O extends z.ZodType = z.ZodType,
> {
  name: N;
  description: string;
  input: I;
  output: O;
}

export function defineTool<const N extends string, I extends z.ZodObject, O extends z.ZodType>(
  tool: KitTool<N, I, O>,
): KitTool<N, I, O> {
  return tool;
}

/** The tool as the prompt describes it (MCP-style input and output JSON Schema). */
export function toToolSpec(tool: KitTool): ToolSpec {
  return {
    name: tool.name,
    description: tool.description,
    inputSchema: z.toJSONSchema(tool.input) as Record<string, unknown>,
    outputSchema: z.toJSONSchema(tool.output) as Record<string, unknown>,
    annotations: { readOnlyHint: true },
  };
}

export interface GalleryDashboard {
  title: string;
  description: string;
  program: string;
}

/**
 * Everything about a kit except its React components. Safe to import on the
 * server: the prompt route builds the system prompt from this plus the kit's
 * generated library spec.
 */
export interface KitDefinition {
  id: string;
  name: string;
  tagline: string;
  /** First line of the system prompt. */
  preamble: string;
  /** Kit-specific rules, appended after the base dashboard rules. */
  rules: string[];
  tools: KitTool[];
  /** Hand-written dashboards: shown in the gallery and used as prompt examples. */
  gallery: GalleryDashboard[];
  /** Suggested requests for the generate view. */
  starters: string[];
}
