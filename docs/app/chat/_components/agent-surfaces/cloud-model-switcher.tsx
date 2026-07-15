"use client";

import { MODEL_OPTIONS, type ModelOption } from "@/lib/openui-cloud/models";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@openuidev/react-ui";
import { useMemo } from "react";
import styles from "../../chat-page.module.css";

interface CloudModelSwitcherProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function CloudModelSwitcher({ selectedModel, onModelChange }: CloudModelSwitcherProps) {
  const selectedOption =
    MODEL_OPTIONS.find((model) => model.id === selectedModel) ?? MODEL_OPTIONS[0];
  const groupedModels = useMemo(() => groupByProvider(MODEL_OPTIONS), []);

  return (
    <div className={styles.modelSwitcher}>
      <Select value={selectedModel} onValueChange={onModelChange} size="sm">
        <SelectTrigger
          aria-label="Select model"
          className={styles.modelSwitcherTrigger}
          title={selectedOption?.id ?? selectedModel}
        >
          <span className={styles.modelSwitcherValue}>{selectedOption?.name ?? selectedModel}</span>
        </SelectTrigger>
        <SelectContent align="start" className={styles.modelSwitcherContent}>
          {groupedModels.map(([provider, providerModels]) => (
            <SelectGroup key={provider}>
              <SelectLabel>{provider}</SelectLabel>
              {providerModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <span className={styles.modelOption}>
                    <span className={styles.modelOptionHeading}>
                      <span className={styles.modelOptionName}>{model.name}</span>
                    </span>
                    <span className={styles.modelOptionId}>{model.id}</span>
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

function groupByProvider(models: readonly ModelOption[]): [string, ModelOption[]][] {
  const grouped = new Map<string, ModelOption[]>();

  for (const model of models) {
    const group = grouped.get(model.provider) ?? [];
    group.push(model);
    grouped.set(model.provider, group);
  }

  return [...grouped.entries()];
}
