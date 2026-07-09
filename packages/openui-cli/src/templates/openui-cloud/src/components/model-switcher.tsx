"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@openuidev/react-ui";
import { useMemo } from "react";

import { MODEL_OPTIONS, type ModelOption } from "@/lib/models";

interface ModelSwitcherProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function ModelSwitcher({ selectedModel, onModelChange }: ModelSwitcherProps) {
  const selectedOption =
    MODEL_OPTIONS.find((model) => model.id === selectedModel) ?? MODEL_OPTIONS[0];
  const groupedModels = useMemo(() => groupByProvider(MODEL_OPTIONS), []);

  return (
    <div className="openui-cloud-model-switcher">
      <Select value={selectedModel} onValueChange={onModelChange} size="sm">
        <SelectTrigger
          aria-label="Select model"
          className="openui-cloud-model-switcher__trigger"
          title={selectedOption?.id ?? selectedModel}
        >
          <span className="openui-cloud-model-switcher__value">
            {selectedOption?.name ?? selectedModel}
          </span>
          {selectedOption?.badge ? (
            <span className="openui-cloud-model-switcher__model-badge">{selectedOption.badge}</span>
          ) : null}
        </SelectTrigger>
        <SelectContent align="start" className="openui-cloud-model-switcher__content">
          {groupedModels.map(([provider, providerModels]) => (
            <SelectGroup key={provider}>
              <SelectLabel>{provider}</SelectLabel>
              {providerModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <span className="openui-cloud-model-switcher__option">
                    <span className="openui-cloud-model-switcher__option-heading">
                      <span className="openui-cloud-model-switcher__option-name">{model.name}</span>
                      {model.badge ? (
                        <span className="openui-cloud-model-switcher__model-badge">
                          {model.badge}
                        </span>
                      ) : null}
                    </span>
                    <span className="openui-cloud-model-switcher__option-id">{model.id}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function groupByProvider(models: ModelOption[]): [string, ModelOption[]][] {
  const grouped = new Map<string, ModelOption[]>();

  for (const model of models) {
    const group = grouped.get(model.provider) ?? [];
    group.push(model);
    grouped.set(model.provider, group);
  }

  return [...grouped.entries()];
}
