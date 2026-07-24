import { type ModelOption } from "@/lib/models";

import { getModelBadge } from "./utils";

// Trigger sits on a white pill; the dropdown row sits on the themed surface —
// so the two contexts use different chip styles for the same badge.
const BADGE_STYLES = {
  trigger: {
    recommended: "bg-indigo-100 text-indigo-700",
    free: "bg-green-100 text-green-700",
  },
  row: {
    recommended: "bg-indigo-500/15 text-indigo-400",
    free: "bg-green-500/15 text-green-400",
  },
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
    <span className={`shrink-0 font-semibold ${shape} ${BADGE_STYLES[variant][badge.kind]}`}>
      {badge.label}
    </span>
  );
}
