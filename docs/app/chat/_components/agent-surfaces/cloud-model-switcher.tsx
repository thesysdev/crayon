"use client";

import { MODEL_OPTIONS, type ModelOption as CloudModelOption } from "@/lib/openui-cloud/models";
import { ModelSwitcher, type ModelOption } from "@openuidev/react-ui";
import { useMemo } from "react";
import styles from "../../chat-page.module.css";

const PROVIDER_ORDER: CloudModelOption["provider"][] = ["Anthropic", "OpenAI", "Google"];

interface CloudModelSwitcherProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
  disabledReason?: string;
}

export function CloudModelSwitcher({
  selectedModel,
  onModelChange,
  disabled = false,
  disabledReason,
}: CloudModelSwitcherProps) {
  const models = useMemo(() => createModelOptions(MODEL_OPTIONS), []);

  return (
    <div className={styles.modelSwitcher}>
      <fieldset
        className={styles.modelSwitcherFieldset}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
      >
        <ModelSwitcher models={models} value={selectedModel} onValueChange={onModelChange} />
      </fieldset>
    </div>
  );
}

function createModelOptions(models: readonly CloudModelOption[]): ModelOption[] {
  return PROVIDER_ORDER.flatMap((provider) =>
    models.filter((model) => model.provider === provider),
  ).map((model) => ({
    id: model.id,
    name: model.name,
    group: model.provider,
    logo: <ProviderLogo provider={model.provider} />,
  }));
}

function ProviderLogo({ provider }: { provider: CloudModelOption["provider"] }) {
  return (
    <span
      className={styles.modelProviderLogo}
      data-provider={provider.toLowerCase()}
      aria-hidden="true"
    />
  );
}
