import { type ModelOption } from "@/lib/models";

import { getModelBadge } from "./utils";

// Free uses the success color from the @openuidev design tokens. Labels use
// neutral primary text while the leading dot carries the semantic color.
// Trigger and row differ only in shape/size.
const BADGE_DOT_COLORS = {
  free: "bg-[var(--openui-border-success-emphasis)]",
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

  if (variant === "trigger") {
    return (
      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--openui-border-default)] bg-transparent">
        <span
          aria-hidden="true"
          className={`h-1.5 w-1.5 rounded-full ${BADGE_DOT_COLORS[badge.kind]}`}
        />
        <span className="sr-only">{badge.label}</span>
      </span>
    );
  }

  return (
    <span className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 shrink-0 items-center gap-1 rounded-full border border-[var(--openui-border-default)] bg-transparent px-2 py-0.5 text-xs font-normal text-[color:var(--openui-text-neutral-primary)]">
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${BADGE_DOT_COLORS[badge.kind]}`}
      />
      {badge.label}
    </span>
  );
}
