"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
} from "../../components/Select";

import { groupModels, useHydrated } from "./utils";

import "./modelSwitcher.scss";

export interface ModelOption {
  /** Unique id — the value the switcher reports through `onValueChange`. */
  id: string;
  /** Display name. */
  name: string;
  /** Optional section header this model is grouped under (e.g. a provider or "Free"). */
  group?: string;
  /** Optional chip label (e.g. "Free"). */
  badge?: string;
  /** Marks the model with a "Recommended" chip. */
  recommended?: boolean;
  /** Optional leading logo/icon — apps supply their own asset. */
  logo?: ReactNode;
}

export interface ModelSwitcherProps {
  /** The models to choose from. Grouped by `group` in first-seen order. */
  models: ModelOption[];
  /** The selected model id. */
  value: string;
  /** Called with the newly selected model id. */
  onValueChange: (id: string) => void;
}

/**
 * A dropdown for picking an LLM, grouped by `ModelOption.group`, with optional
 * per-model logo, "Recommended", and badge chips. Data-agnostic: pass your own
 * `models` — the block owns no model list.
 */
export function ModelSwitcher({ models, value, onValueChange }: ModelSwitcherProps) {
  const hydrated = useHydrated();
  const selected = models.find((model) => model.id === value) ?? models[0];
  const groups = groupModels(models);

  return (
    <div className="openui-model-switcher">
      <Select value={value} onValueChange={onValueChange} size="sm">
        <SelectTrigger
          aria-label="Select model"
          title={hydrated ? (selected?.id ?? value) : undefined}
          className="openui-model-switcher-trigger"
        >
          {hydrated ? <TriggerContent option={selected} fallback={value} /> : <TriggerSkeleton />}
        </SelectTrigger>
        <SelectContent align="start" className="openui-model-switcher-content">
          {groups.map((group, index) => (
            <SelectGroup key={group.label ?? `group-${index}`}>
              {index > 0 ? <SelectSeparator /> : null}
              {group.label ? <SelectLabel>{group.label}</SelectLabel> : null}
              {group.models.map((model) => (
                <SelectItem
                  key={model.id}
                  value={model.id}
                  showTick={false}
                  className="openui-model-switcher-item"
                >
                  <ModelRow model={model} />
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function TriggerContent({
  option,
  fallback,
}: {
  option: ModelOption | undefined;
  fallback: string;
}) {
  return (
    <>
      {option?.logo ? <span className="openui-model-switcher-logo">{option.logo}</span> : null}
      <span className="openui-model-switcher-name">{option?.name ?? fallback}</span>
      {option ? <Badge model={option} variant="trigger" /> : null}
    </>
  );
}

// Neutral skeleton shown until the client reads the persisted model, so a
// refresh doesn't flash a fallback name.
function TriggerSkeleton() {
  return (
    <>
      <span aria-hidden="true" className="openui-model-switcher-skeleton-dot" />
      <span aria-hidden="true" className="openui-model-switcher-skeleton-bar" />
    </>
  );
}

function ModelRow({ model }: { model: ModelOption }) {
  return (
    <span className="openui-model-switcher-row">
      {model.logo ? <span className="openui-model-switcher-logo">{model.logo}</span> : null}
      <span className="openui-model-switcher-name">{model.name}</span>
      <Badge model={model} variant="row" />
    </span>
  );
}

function badgeFor(model: ModelOption): { label: string; kind: "recommended" | "badge" } | null {
  if (model.recommended) return { label: "Recommended", kind: "recommended" };
  if (model.badge) return { label: model.badge, kind: "badge" };
  return null;
}

function Badge({ model, variant }: { model: ModelOption; variant: "trigger" | "row" }) {
  const badge = badgeFor(model);
  if (!badge) return null;
  const dot = clsx("openui-model-switcher-dot", `openui-model-switcher-dot-${badge.kind}`);

  if (variant === "trigger") {
    return (
      <span className="openui-model-switcher-badge-trigger">
        <span aria-hidden="true" className={dot} />
        <span className="openui-model-switcher-sr">{badge.label}</span>
      </span>
    );
  }
  return (
    <span className="openui-model-switcher-badge-row">
      <span aria-hidden="true" className={dot} />
      {badge.label}
    </span>
  );
}
