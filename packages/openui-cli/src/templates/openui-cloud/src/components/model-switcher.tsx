"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
} from "@openuidev/react-ui";
import { useMemo, useSyncExternalStore } from "react";

import { useTheme } from "@/hooks/use-system-theme";
import { MODEL_OPTIONS, type ModelOption } from "@/lib/models";

interface ModelSwitcherProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

// Order the paid provider groups the way the console lists them.
const PROVIDER_ORDER: ModelOption["provider"][] = ["Anthropic", "OpenAI", "Google"];
// The model highlighted with a "Recommended" chip.
const RECOMMENDED_MODEL_ID = "anthropic/claude-sonnet-5";

// The persisted model lives in localStorage, so the server (and the first
// client render) can only fall back to DEFAULT_MODEL. Showing that default and
// then swapping to the stored model produces a visible flash on refresh. This
// hook returns false on the server / during hydration and true once mounted, so
// the trigger can render a neutral skeleton until the real value is known.
const subscribeNoop = () => () => {};
function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

function ProviderLogo({
  provider,
  variant,
  size = "md",
}: {
  provider: string;
  // Force a mark variant regardless of app theme (the white trigger always
  // needs the light-background mark).
  variant?: "light" | "dark";
  size?: "sm" | "md";
}) {
  const mode = useTheme();
  const resolved = variant ?? mode;
  const box = size === "sm" ? "h-5 w-5 rounded-md" : "h-7 w-7 rounded-lg";
  const img = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center bg-black/[0.06] dark:bg-white/10 ${box}`}
    >
      {/* Provider marks live in public/logos/<provider>-<light|dark>.svg. Static
          SVG icons, so a plain <img> is intentional (next/image adds no value here). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/logos/${provider.toLowerCase()}-${resolved}.svg`} alt="" className={img} />
    </span>
  );
}

function ModelRow({ model }: { model: ModelOption }) {
  return (
    <span className="flex w-full min-w-0 items-center gap-2.5">
      <ProviderLogo provider={model.provider} />
      <span className="min-w-0 flex-1 truncate">{model.name}</span>
      {model.id === RECOMMENDED_MODEL_ID ? (
        <span className="shrink-0 rounded-md bg-indigo-500/15 px-2 py-0.5 text-xs font-semibold text-indigo-400">
          Recommended
        </span>
      ) : model.badge === "Free" ? (
        <span className="shrink-0 rounded-md bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-400">
          Free
        </span>
      ) : null}
    </span>
  );
}

export function ModelSwitcher({ selectedModel, onModelChange }: ModelSwitcherProps) {
  const hydrated = useHydrated();
  const selectedOption =
    MODEL_OPTIONS.find((model) => model.id === selectedModel) ?? MODEL_OPTIONS[0];
  const { paidGroups, freeModels } = useMemo(() => splitModels(MODEL_OPTIONS), []);

  return (
    <div className="min-w-0">
      <Select value={selectedModel} onValueChange={onModelChange} size="sm">
        <SelectTrigger
          aria-label="Select model"
          title={hydrated ? (selectedOption?.id ?? selectedModel) : undefined}
          className="flex! h-8! w-auto! max-w-[240px]! items-center! justify-start! gap-1.5! rounded-lg! border! border-gray-200! bg-white! px-2.5! text-sm! text-gray-900! shadow-sm"
        >
          {hydrated ? (
            <>
              {selectedOption ? (
                <ProviderLogo provider={selectedOption.provider} variant="light" size="sm" />
              ) : null}
              <span className="min-w-0 flex-1 truncate">
                {selectedOption?.name ?? selectedModel}
              </span>
              {selectedOption?.id === RECOMMENDED_MODEL_ID ? (
                <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                  Recommended
                </span>
              ) : selectedOption?.badge ? (
                <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                  {selectedOption.badge}
                </span>
              ) : null}
            </>
          ) : (
            // Before the client reads localStorage, show a neutral skeleton
            // instead of the default model so refresh doesn't flash it.
            <>
              <span
                aria-hidden="true"
                className="h-5 w-5 shrink-0 animate-pulse rounded-md bg-gray-200"
              />
              <span aria-hidden="true" className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            </>
          )}
        </SelectTrigger>
        <SelectContent
          align="start"
          className="max-h-[360px]! w-[min(360px,calc(100vw-32px))]! overflow-auto!"
        >
          {paidGroups.map(([provider, providerModels], index) => (
            <SelectGroup key={provider}>
              {index > 0 ? <SelectSeparator /> : null}
              {providerModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <ModelRow model={model} />
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
          {freeModels.length > 0 ? (
            <SelectGroup>
              <SelectSeparator />
              <SelectLabel className="flex items-center justify-between gap-2">
                <span className="font-semibold text-green-400">Free</span>
                <a
                  href="https://openui.com/docs"
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="text-xs font-normal text-gray-400 no-underline hover:underline"
                >
                  Usage policy
                </a>
              </SelectLabel>
              {freeModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <ModelRow model={model} />
                </SelectItem>
              ))}
            </SelectGroup>
          ) : null}
        </SelectContent>
      </Select>
    </div>
  );
}

function splitModels(models: ModelOption[]): {
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
