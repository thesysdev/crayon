"use client";

import { MODEL_OPTIONS, type ModelOption } from "@/lib/openui-cloud/models";
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
import styles from "../../chat-page.module.css";

const RECOMMENDED_MODEL_ID = "anthropic/claude-sonnet-5";
const PROVIDER_ORDER: ModelOption["provider"][] = ["Anthropic", "OpenAI", "Google"];

interface CloudModelSwitcherProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

export function CloudModelSwitcher({
  selectedModel,
  onModelChange,
  disabled = false,
}: CloudModelSwitcherProps) {
  const selectedOption =
    MODEL_OPTIONS.find((model) => model.id === selectedModel) ?? MODEL_OPTIONS[0];
  const { freeModels, paidGroups } = useMemo(() => splitModels(MODEL_OPTIONS), []);

  return (
    <div className={styles.modelSwitcher}>
      <Select value={selectedModel} onValueChange={onModelChange} size="sm" disabled={disabled}>
        <SelectTrigger
          aria-label={disabled ? "Model selection disabled for read-only demo" : "Select model"}
          className={styles.modelSwitcherTrigger}
          title={
            disabled
              ? "This read-only demo uses a fixed recorded model."
              : (selectedOption?.id ?? selectedModel)
          }
        >
          {selectedOption && <ProviderMark provider={selectedOption.provider} size="small" />}
          <span className={styles.modelSwitcherValue}>{selectedOption?.name ?? selectedModel}</span>
          {selectedOption && <ModelBadge model={selectedOption} compact />}
        </SelectTrigger>
        <SelectContent align="start" className={styles.modelSwitcherContent}>
          {paidGroups.map(([provider, providerModels], index) => (
            <SelectGroup key={provider}>
              {index > 0 && <SelectSeparator />}
              {providerModels.map((model) => (
                <SelectItem key={model.id} value={model.id} showTick={false}>
                  <ModelRow model={model} />
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
          {freeModels.length > 0 && (
            <SelectGroup>
              <SelectSeparator />
              <SelectLabel className={styles.modelFreeLabel}>Free</SelectLabel>
              {freeModels.map((model) => (
                <SelectItem key={model.id} value={model.id} showTick={false}>
                  <ModelRow model={model} />
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

function ModelRow({ model }: { model: ModelOption }) {
  return (
    <span className={styles.modelOption}>
      <ProviderMark provider={model.provider} />
      <span className={styles.modelOptionName}>{model.name}</span>
      <ModelBadge model={model} />
    </span>
  );
}

function ProviderMark({
  provider,
  size = "medium",
}: {
  provider: ModelOption["provider"];
  size?: "small" | "medium";
}) {
  return (
    <span
      className={styles.providerMark}
      data-provider={provider.toLowerCase()}
      data-size={size}
      aria-hidden="true"
    >
      {provider === "OpenAI" ? (
        <img src="/brand-icons/openai.svg" alt="" />
      ) : (
        <span>{provider === "Google" ? "G" : "AI"}</span>
      )}
    </span>
  );
}

function ModelBadge({ model, compact = false }: { model: ModelOption; compact?: boolean }) {
  const label = model.id === RECOMMENDED_MODEL_ID ? "Recommended" : model.badge;
  if (!label) return null;

  return (
    <span
      className={styles.modelBadge}
      data-kind={label === "Free" ? "free" : "recommended"}
      data-compact={compact}
    >
      <span className={styles.modelBadgeDot} aria-hidden="true" />
      <span className={compact ? "sr-only" : undefined}>{label}</span>
    </span>
  );
}

function splitModels(models: readonly ModelOption[]): {
  paidGroups: [ModelOption["provider"], ModelOption[]][];
  freeModels: ModelOption[];
} {
  const groupedPaidModels = new Map<ModelOption["provider"], ModelOption[]>();
  const freeModels: ModelOption[] = [];

  for (const model of models) {
    if (model.badge === "Free") {
      freeModels.push(model);
      continue;
    }

    const providerModels = groupedPaidModels.get(model.provider) ?? [];
    providerModels.push(model);
    groupedPaidModels.set(model.provider, providerModels);
  }

  return {
    paidGroups: PROVIDER_ORDER.filter((provider) => groupedPaidModels.has(provider)).map(
      (provider) => [provider, groupedPaidModels.get(provider) as ModelOption[]],
    ),
    freeModels,
  };
}
