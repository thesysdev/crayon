"use client";

import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "../Select";

export interface ModelOption {
  id: string;
  name: string;
  provider?: string;
  badge?: string;
}

export interface ModelSwitcherProps {
  models: readonly ModelOption[];
  value: string;
  onValueChange: (model: string) => void;
  ariaLabel?: string;
  className?: string;
}

export function ModelSwitcher({
  models,
  value,
  onValueChange,
  ariaLabel = "Select model",
  className,
}: ModelSwitcherProps) {
  const selectedOption = models.find((model) => model.id === value);
  const groupedModels = useMemo(() => groupByProvider(models), [models]);
  const rootClassName = ["openui-model-switcher", className].filter(Boolean).join(" ");

  return (
    <div className={rootClassName}>
      <Select value={value} onValueChange={onValueChange} size="sm" disabled={models.length === 0}>
        <SelectTrigger
          aria-label={ariaLabel}
          className="openui-model-switcher__trigger"
          title={selectedOption?.id ?? value}
        >
          <span className="openui-model-switcher__value">
            {selectedOption?.name ?? value ?? ariaLabel}
          </span>
          {selectedOption?.badge ? (
            <span className="openui-model-switcher__badge">{selectedOption.badge}</span>
          ) : null}
        </SelectTrigger>
        <SelectContent align="start" className="openui-model-switcher__content">
          {groupedModels.map(([provider, providerModels]) => (
            <SelectGroup key={provider}>
              {provider ? <SelectLabel>{provider}</SelectLabel> : null}
              {providerModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <span className="openui-model-switcher__option">
                    <span className="openui-model-switcher__option-heading">
                      <span className="openui-model-switcher__option-name">{model.name}</span>
                      {model.badge ? (
                        <span className="openui-model-switcher__badge">{model.badge}</span>
                      ) : null}
                    </span>
                    <span className="openui-model-switcher__option-id">{model.id}</span>
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

function groupByProvider(models: readonly ModelOption[]): Array<[string, readonly ModelOption[]]> {
  const grouped = new Map<string, ModelOption[]>();

  for (const model of models) {
    const provider = model.provider ?? "";
    const group = grouped.get(provider) ?? [];
    group.push(model);
    grouped.set(provider, group);
  }

  return [...grouped.entries()];
}
