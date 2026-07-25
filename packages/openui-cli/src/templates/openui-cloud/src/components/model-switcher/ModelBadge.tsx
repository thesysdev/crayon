import { type ModelOption } from "@/lib/models";

import { getModelBadge } from "./utils";

// Recommended = info (blue), Free = success (green), both from the @openuidev
// design tokens. Trigger and row share the same colors (both sit on the themed
// surface); they differ only in shape/size, handled below.
const BADGE_COLORS = {
  recommended: "bg-[var(--openui-info-background)] text-[color:var(--openui-text-info-primary)]",
  free: "bg-[var(--openui-success-background)] text-[color:var(--openui-text-success-primary)]",
} as const;

export function ModelBadge({
  model,
  variant,
}: {
  model: ModelOption;
  variant: "trigger" | "row";
}) {
  const badge = getModelBadge(model);
  if (!badge) return null;

  const shape =
    variant === "trigger"
      ? "rounded-full px-2 py-0.5 text-[10px]"
      : "rounded-md px-2 py-0.5 text-xs";

  return (
    <span className={`shrink-0 font-semibold ${shape} ${BADGE_COLORS[badge.kind]}`}>
      {badge.label}
    </span>
  );
}
