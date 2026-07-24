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
import { useMemo } from "react";

import { MODEL_OPTIONS } from "@/lib/models";

import { ModelRow } from "./ModelRow";
import { TriggerContent } from "./TriggerContent";
import { splitModels, useHydrated } from "./utils";

interface ModelSwitcherProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
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
          <TriggerContent
            option={selectedOption}
            fallbackLabel={selectedModel}
            hydrated={hydrated}
          />
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
