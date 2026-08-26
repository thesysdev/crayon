import { useSyncExternalStore } from "react";

import type { ModelOption } from "./ModelSwitcher";

export interface ModelGroup {
  /** Group header, or null for the ungrouped leading section. */
  label: string | null;
  models: ModelOption[];
}

// Group models by `group` in first-seen order; ungrouped models lead, headerless.
export function groupModels(models: ModelOption[]): ModelGroup[] {
  const order: string[] = [];
  const byGroup = new Map<string, ModelOption[]>();
  for (const model of models) {
    const key = model.group ?? "";
    let bucket = byGroup.get(key);
    if (!bucket) {
      bucket = [];
      byGroup.set(key, bucket);
      order.push(key);
    }
    bucket.push(model);
  }
  return order.map((key) => ({ label: key === "" ? null : key, models: byGroup.get(key) ?? [] }));
}

// SSR-flash guard: false on the server / during hydration, true once mounted, so
// the trigger can render a neutral skeleton until the persisted value is known.
const subscribeNoop = () => () => {};
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}
