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
import { Tag } from "../../components/Tag";
import { useTheme, type ThemeMode } from "../../components/ThemeProvider";

import { groupModels, useHydrated } from "./utils";

/** A single logo node, or a light/dark pair the switcher picks from by theme. */
export type ModelLogo = ReactNode | { light: ReactNode; dark: ReactNode };

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
  /** Optional leading logo/icon — apps supply their own asset. Pass a
   *  `{ light, dark }` pair to have the switcher swap it by the active theme. */
  logo?: ModelLogo;
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
 * `models` — the block owns no model list. A model's `logo` may be a single
 * node or a `{ light, dark }` pair the switcher swaps by the active theme.
 */
export function ModelSwitcher({ models, value, onValueChange }: ModelSwitcherProps) {
  const hydrated = useHydrated();
  const { mode } = useTheme();
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
          {hydrated ? (
            <TriggerContent option={selected} fallback={value} mode={mode} />
          ) : (
            <TriggerSkeleton />
          )}
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
                  <ModelRow model={model} mode={mode} />
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Resolve a model's logo for the active theme: a `{ light, dark }` pair yields
// the variant for `mode`; a plain node renders as-is.
function resolveLogo(logo: ModelLogo | undefined, mode: ThemeMode): ReactNode {
  if (logo && typeof logo === "object" && "light" in logo && "dark" in logo) {
    return mode === "dark" ? logo.dark : logo.light;
  }
  return (logo ?? null) as ReactNode;
}

function TriggerContent({
  option,
  fallback,
  mode,
}: {
  option: ModelOption | undefined;
  fallback: string;
  mode: ThemeMode;
}) {
  const logo = option ? resolveLogo(option.logo, mode) : null;
  return (
    <>
      {logo ? <span className="openui-model-switcher-logo">{logo}</span> : null}
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

function ModelRow({ model, mode }: { model: ModelOption; mode: ThemeMode }) {
  const logo = resolveLogo(model.logo, mode);
  return (
    <span className="openui-model-switcher-row">
      {logo ? <span className="openui-model-switcher-logo">{logo}</span> : null}
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

  // The trigger is too compact for a Tag — show a colored dot with an
  // sr-only label instead.
  if (variant === "trigger") {
    return (
      <span className="openui-model-switcher-badge-trigger">
        <span
          aria-hidden="true"
          className={clsx("openui-model-switcher-dot", `openui-model-switcher-dot-${badge.kind}`)}
        />
        <span className="openui-model-switcher-sr">{badge.label}</span>
      </span>
    );
  }
  return (
    <Tag size="sm" variant={badge.kind === "recommended" ? "info" : "success"} text={badge.label} />
  );
}
