import { useSyncExternalStore } from "react";

import { type ModelOption } from "@/lib/models";

// Order the paid provider groups the way the console lists them.
export const PROVIDER_ORDER: ModelOption["provider"][] = ["Anthropic", "OpenAI", "Google"];
// The model highlighted with a "Recommended" chip.
export const RECOMMENDED_MODEL_ID = "anthropic/claude-sonnet-5";

// Group paid models by provider (in PROVIDER_ORDER) and pull the free models
// into their own list so the dropdown can render a dedicated "Free" section.
export function splitModels(models: ModelOption[]): {
  paidGroups: [string, ModelOption[]][];
  freeModels: ModelOption[];
} {
  const freeModels: ModelOption[] = [];
  const paid = new Map<string, ModelOption[]>();

  for (const model of models) {
    if (model.badge === "Free") {
      freeModels.push(model);
      continue;
    }
    const group = paid.get(model.provider) ?? [];
    group.push(model);
    paid.set(model.provider, group);
  }

  const paidGroups = PROVIDER_ORDER.filter((provider) => paid.has(provider)).map(
    (provider) => [provider, paid.get(provider) as ModelOption[]] as [string, ModelOption[]],
  );

  return { paidGroups, freeModels };
}

export type ModelBadgeInfo = { label: string; kind: "recommended" | "free" };

// Single source of truth for which chip a model gets (used by both the trigger
// and the dropdown rows).
export function getModelBadge(model: ModelOption): ModelBadgeInfo | null {
  if (model.id === RECOMMENDED_MODEL_ID) return { label: "Recommended", kind: "recommended" };
  if (model.badge === "Free") return { label: model.badge, kind: "free" };
  return null;
}

// The persisted model lives in localStorage, so the server (and the first
// client render) can only fall back to DEFAULT_MODEL. Showing that default and
// then swapping to the stored model produces a visible flash on refresh. This
// hook returns false on the server / during hydration and true once mounted, so
// the trigger can render a neutral skeleton until the real value is known.
const subscribeNoop = () => () => {};
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}
