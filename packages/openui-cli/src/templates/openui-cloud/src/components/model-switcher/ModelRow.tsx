import { type ModelOption } from "@/lib/models";

import { ModelBadge } from "./ModelBadge";
import { ProviderLogo } from "./ProviderLogo";

// A single row inside the dropdown: provider logo, name, and an optional Free
// chip.
export function ModelRow({ model }: { model: ModelOption }) {
  return (
    <span className="flex w-full min-w-0 items-center gap-2.5">
      <ProviderLogo provider={model.provider} />
      <span className="min-w-0 flex-1 truncate">{model.name}</span>
      <ModelBadge model={model} variant="row" />
    </span>
  );
}
