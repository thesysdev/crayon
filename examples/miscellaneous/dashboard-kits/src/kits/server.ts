import {
  buildSystemPrompt as buildKitPrompt,
  getKit,
  runTool as runKitTool,
  SAMPLE_HANDLERS,
  type KitDefinition,
} from "@openuidev/dashboard-kits/server";
import type { LibrarySpec } from "@openuidev/lang-core";
import analyticsSpec from "../generated/analytics.spec.json";
import ecommerceSpec from "../generated/ecommerce.spec.json";

// Server-only: the library specs written by `npm run generate`, prompt
// assembly, and the sample-data tool handlers.

const SPECS: Record<string, LibrarySpec> = {
  ecommerce: ecommerceSpec as LibrarySpec,
  analytics: analyticsSpec as LibrarySpec,
};

export function getKitSpec(kitId: string): LibrarySpec {
  const spec = SPECS[kitId];
  if (!spec) throw new Error(`Unknown kit: ${kitId}`);
  return spec;
}

/** The full self-hosted system prompt: kit library, tools, rules, and examples. */
export function buildSystemPrompt(kit: KitDefinition): string {
  return buildKitPrompt(kit, getKitSpec(kit.id));
}

/** Runs one of a kit's tools against its sample data, validating both sides. */
export function runTool(kitId: string, toolName: string, args: unknown): unknown {
  const kit = getKit(kitId);
  const handlers = SAMPLE_HANDLERS[kitId];
  if (!kit || !handlers) throw new Error(`Unknown kit: ${kitId}`);
  return runKitTool(kit, toolName, args, handlers);
}
