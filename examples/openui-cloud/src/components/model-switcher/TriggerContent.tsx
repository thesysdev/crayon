import { type ModelOption } from "@/lib/models";

import { ModelBadge } from "./ModelBadge";
import { ProviderLogo } from "./ProviderLogo";

// Neutral skeleton shown until the client reads the persisted model from
// localStorage, so a refresh doesn't flash the default model.
function TriggerSkeleton() {
  return (
    <>
      <span
        aria-hidden="true"
        className="h-5 w-5 shrink-0 animate-pulse rounded-md bg-[var(--openui-border-default)]"
      />
      <span
        aria-hidden="true"
        className="h-4 w-24 animate-pulse rounded bg-[var(--openui-border-default)]"
      />
    </>
  );
}

export function TriggerContent({
  option,
  fallbackLabel,
  hydrated,
}: {
  option: ModelOption | undefined;
  fallbackLabel: string;
  hydrated: boolean;
}) {
  if (!hydrated) return <TriggerSkeleton />;

  return (
    <>
      {option ? <ProviderLogo provider={option.provider} size="sm" /> : null}
      <span className="min-w-0 flex-1 truncate">{option?.name ?? fallbackLabel}</span>
      {option ? <ModelBadge model={option} variant="trigger" /> : null}
    </>
  );
}
