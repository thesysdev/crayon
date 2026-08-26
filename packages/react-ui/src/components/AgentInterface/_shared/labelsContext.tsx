import { createContext, useContext, useMemo, type ReactNode } from "react";

/** Per-tab labels for the per-thread Workspace rail. */
export interface WorkspaceTabLabels {
  all?: string;
  artifacts?: string;
  apps?: string;
}

/**
 * Consumer-overridable display strings for the artifact browser + workspace.
 * Every field is optional; omitted values fall back to the English defaults.
 * Pass via `<AgentInterface labels={...}>`.
 */
export interface AgentInterfaceLabels {
  /**
   * Fallback title/nav label for the artifact browser when no category is
   * configured (a configured category always uses its own `name`). Default
   * `"Artifacts"`.
   */
  defaultCategory?: string;
  /** Title for the workspace rail and its toggle tooltip. Default `"Thread workspace"`. */
  workspaceToggle?: string;
  /** Labels for the workspace rail tabs. Defaults: `All` / `Artifacts` / `Apps`. */
  tabs?: WorkspaceTabLabels;
}

/** Fully-resolved labels (defaults applied) — what consumers of the hook get. */
export interface ResolvedLabels {
  defaultCategory: string;
  workspaceToggle: string;
  tabs: { all: string; artifacts: string; apps: string };
}

const DEFAULT_LABELS: ResolvedLabels = {
  defaultCategory: "Artifacts",
  workspaceToggle: "Thread workspace",
  tabs: { all: "All", artifacts: "Artifacts", apps: "Apps" },
};

const LabelsContext = createContext<ResolvedLabels>(DEFAULT_LABELS);

export interface LabelsProviderProps {
  labels?: AgentInterfaceLabels;
  children: ReactNode;
}

export const LabelsProvider = ({ labels, children }: LabelsProviderProps) => {
  const value = useMemo<ResolvedLabels>(
    () => ({
      defaultCategory: labels?.defaultCategory ?? DEFAULT_LABELS.defaultCategory,
      workspaceToggle: labels?.workspaceToggle ?? DEFAULT_LABELS.workspaceToggle,
      tabs: {
        all: labels?.tabs?.all ?? DEFAULT_LABELS.tabs.all,
        artifacts: labels?.tabs?.artifacts ?? DEFAULT_LABELS.tabs.artifacts,
        apps: labels?.tabs?.apps ?? DEFAULT_LABELS.tabs.apps,
      },
    }),
    [
      labels?.defaultCategory,
      labels?.workspaceToggle,
      labels?.tabs?.all,
      labels?.tabs?.artifacts,
      labels?.tabs?.apps,
    ],
  );
  return <LabelsContext.Provider value={value}>{children}</LabelsContext.Provider>;
};

/**
 * Resolved (default-merged) consumer labels for the artifact browser + workspace.
 * Works without a provider (returns the English defaults).
 */
export const useAgentInterfaceLabels = (): ResolvedLabels => useContext(LabelsContext);
