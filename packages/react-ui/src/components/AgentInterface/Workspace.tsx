import {
  useActiveDetailedView,
  useArtifactCategories,
  useArtifactList,
  useDetailedView,
  useDetailedViewStore,
  type ArtifactEntry,
} from "@openuidev/react-headless";
import clsx from "clsx";
import { X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useLayoutContext } from "../../context/LayoutContext";
import { IconButton } from "../IconButton";
import {
  formatArtifactUpdatedAt,
  useArtifactIcon,
  useArtifactTypeLabel,
} from "./ArtifactBrowserPage";
import { useAgentInterfaceLabels, type ResolvedLabels } from "./_shared/labelsContext";
import { useAgentInterfaceStore } from "./_shared/store";

export interface WorkspaceProps {
  className?: string;
  /** Mode C — replaces the entire rail (you own the chrome and visibility). */
  children?: ReactNode;
}

/**
 * Per-thread workspace rail (right edge of the layout) listing the artifacts
 * registered in the active thread.
 *
 * - Renders nothing while the registry is empty — drop-in users without
 *   artifact renderers never see it. Visibility is controlled by the header
 *   workspace toggle.
 * - Sections are driven by the `artifactCategories` configured on
 *   `<AgentInterface>`; a single "Artifacts" section lists everything when no
 *   categories are configured.
 * - Item click activates the corresponding DetailedView; the rail closes while
 *   a DetailedView is open.
 * - Rendered only in the thread view — hidden on Route pages and the
 *   artifact browser. Hidden on mobile.
 *
 * Modes: A (omit → default above) and C (children replace the rail).
 *
 * @category Components
 */
export const Workspace = ({ className, children }: WorkspaceProps) => {
  if (children != null) return <>{children}</>;
  return <DefaultWorkspace className={className} />;
};

type WorkspaceTab = "all" | "artifacts" | "apps";

const DefaultWorkspace = ({ className }: { className?: string }) => {
  const { isWorkspaceOpen, setIsWorkspaceOpen } = useAgentInterfaceStore((state) => ({
    isWorkspaceOpen: state.isWorkspaceOpen,
    setIsWorkspaceOpen: state.setIsWorkspaceOpen,
  }));
  const { isDetailedViewActive } = useActiveDetailedView();
  const { layout } = useLayoutContext();
  const categories = useArtifactCategories();
  const labels = useAgentInterfaceLabels();
  const all = useArtifactList();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("all");
  const entries = latestPerId(all);
  const availableTabs = getAvailableWorkspaceTabs(categories, entries, labels.tabs);
  const selectedTab = availableTabs.some((tab) => tab.value === activeTab)
    ? activeTab
    : (availableTabs[0]?.value ?? "all");
  const shouldShowWorkspace = isWorkspaceOpen && !isDetailedViewActive;

  useEffect(() => {
    if (selectedTab !== activeTab) {
      setActiveTab(selectedTab);
    }
  }, [activeTab, selectedTab]);

  useEffect(() => {
    if (isDetailedViewActive && isWorkspaceOpen) {
      setIsWorkspaceOpen(false);
    }
  }, [isDetailedViewActive, isWorkspaceOpen, setIsWorkspaceOpen]);

  // Nothing renders while the registry is empty; the header controls open state.
  if (entries.length === 0) return null;

  return (
    <>
      {layout === "mobile" && (
        <div
          className={clsx("openui-agent-workspace-sidebar__overlay", {
            "openui-agent-workspace-sidebar__overlay--collapsed": !shouldShowWorkspace,
          })}
          onClick={() => setIsWorkspaceOpen(false)}
        />
      )}
      <div
        className={clsx(
          "openui-agent-workspace-sidebar",
          { "openui-agent-workspace-sidebar--collapsed": !shouldShowWorkspace },
          className,
        )}
      >
        <div className="openui-agent-workspace-sidebar__header">
          <WorkspaceTabs activeTab={selectedTab} tabs={availableTabs} onChange={setActiveTab} />
          <IconButton
            icon={<X size="1em" />}
            onClick={() => setIsWorkspaceOpen(false)}
            size="small"
            variant="tertiary"
            aria-label="Close workspace"
            className="openui-agent-workspace-sidebar__close-button"
          />
        </div>

        <div className="openui-agent-workspace-sidebar__content">
          {categories.length > 0 ? (
            <WorkspaceSections categories={categories} entries={entries} activeTab={selectedTab} />
          ) : (
            <WorkspaceSection entries={entries} />
          )}
        </div>
      </div>
    </>
  );
};

// Tab order is fixed; the user-facing labels come from `labels.tabs` (defaults
// All / Artifacts / Apps). Values stay internal filter keys.
const WORKSPACE_TAB_ORDER: WorkspaceTab[] = ["all", "artifacts", "apps"];

const WorkspaceTabs = ({
  activeTab,
  tabs,
  onChange,
}: {
  activeTab: WorkspaceTab;
  tabs: ReadonlyArray<{ value: WorkspaceTab; label: string }>;
  onChange: (tab: WorkspaceTab) => void;
}) => {
  const tabsRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({
    opacity: 0,
  });

  useLayoutEffect(() => {
    const tabsEl = tabsRef.current;
    const activeButton = tabsEl?.querySelector<HTMLButtonElement>(
      `[data-workspace-tab="${activeTab}"]`,
    );
    if (!tabsEl || !activeButton) return;

    const updateIndicator = () => {
      const tabsRect = tabsEl.getBoundingClientRect();
      const activeButtonRect = activeButton.getBoundingClientRect();

      setIndicatorStyle({
        height: activeButtonRect.height,
        opacity: 1,
        width: activeButtonRect.width,
        transform: `translate(${activeButtonRect.left - tabsRect.left}px, ${
          activeButtonRect.top - tabsRect.top
        }px)`,
      });
    };

    updateIndicator();

    if (typeof ResizeObserver === "undefined") return;

    const resizeObserver = new ResizeObserver(updateIndicator);
    resizeObserver.observe(tabsEl);
    resizeObserver.observe(activeButton);

    return () => {
      resizeObserver.disconnect();
    };
  }, [activeTab]);

  return (
    <div
      ref={tabsRef}
      className="openui-agent-workspace-sidebar__tabs"
      role="tablist"
      aria-label="Workspace sections"
    >
      <span className="openui-agent-workspace-sidebar__tab-indicator" style={indicatorStyle} />
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.value}
          data-workspace-tab={tab.value}
          className={clsx("openui-agent-workspace-sidebar__tab", {
            "openui-agent-workspace-sidebar__tab--active": activeTab === tab.value,
          })}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

const WorkspaceSections = ({
  categories,
  entries,
  activeTab,
}: {
  categories: ReturnType<typeof useArtifactCategories>;
  entries: ReadonlyArray<ArtifactEntry>;
  activeTab: WorkspaceTab;
}) => {
  const visibleCategories = categories
    .filter((category) => entries.some((entry) => entryMatchesCategory(entry, category)))
    .filter((category) => {
      if (activeTab === "all") return true;
      if (activeTab === "apps") return isAppsCategory(category);
      return !isAppsCategory(category);
    });

  return (
    <>
      {visibleCategories.map((category) => (
        <WorkspaceSection
          key={category.name}
          entries={entries.filter((entry) => entryMatchesCategory(entry, category))}
        />
      ))}
    </>
  );
};

const WorkspaceSection = ({
  entries,
  emptyHint,
}: {
  entries: ReadonlyArray<ArtifactEntry>;
  emptyHint?: string;
}) => {
  if (entries.length === 0) {
    if (!emptyHint) return null;
    return <div className="openui-agent-workspace-sidebar__section-empty">{emptyHint}</div>;
  }

  return (
    <ul className="openui-agent-workspace-sidebar__list">
      {entries.map((entry) => (
        <WorkspaceItem key={entry.id} entry={entry} />
      ))}
    </ul>
  );
};

const WorkspaceItem = ({ entry }: { entry: ArtifactEntry }) => {
  const viewId = `${entry.id}:${entry.version}`;
  const { isActive } = useDetailedView(viewId);
  const store = useDetailedViewStore();
  const onClick = () => store.getState().setActiveDetailedView(viewId);
  const icon = useArtifactIcon(entry.type);
  const updatedAt = formatArtifactUpdatedAt(entry.updatedAt);
  const metadata = [useArtifactTypeLabel(entry.type), updatedAt].filter(Boolean).join(" · ");

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={isActive}
        className={clsx("openui-agent-workspace-sidebar__item", {
          "openui-agent-workspace-sidebar__item--active": isActive,
        })}
      >
        <span className="openui-agent-workspace-sidebar__item-icon">{icon}</span>
        <span className="openui-agent-workspace-sidebar__item-body">
          <span className="openui-agent-workspace-sidebar__item-label">{entry.heading}</span>
          {metadata && (
            <span className="openui-agent-workspace-sidebar__item-meta">{metadata}</span>
          )}
        </span>
      </button>
    </li>
  );
};

/** Picks the latest version (highest version number, kept as the last element after sort). */
function latestPerId<T extends { id: string; version: number }>(
  registry: Record<string, T[]>,
): T[] {
  return Object.values(registry)
    .map((versions) => versions[versions.length - 1])
    .filter((entry): entry is T => entry !== undefined);
}

type ArtifactCategory = ReturnType<typeof useArtifactCategories>[number];

function getAvailableWorkspaceTabs(
  categories: ReturnType<typeof useArtifactCategories>,
  entries: ReadonlyArray<ArtifactEntry>,
  tabLabels: ResolvedLabels["tabs"],
): Array<{ value: WorkspaceTab; label: string }> {
  const hasApps =
    categories.length > 0 &&
    categories.some(
      (category) =>
        isAppsCategory(category) && entries.some((entry) => entryMatchesCategory(entry, category)),
    );
  const hasArtifacts =
    categories.length === 0 ||
    categories.some(
      (category) =>
        !isAppsCategory(category) && entries.some((entry) => entryMatchesCategory(entry, category)),
    );

  return WORKSPACE_TAB_ORDER.filter((value) => {
    if (value === "all") return true;
    if (value === "apps") return hasApps;
    return hasArtifacts;
  }).map((value) => ({ value, label: tabLabels[value] }));
}

function isAppsCategory(category: ArtifactCategory) {
  return category.name.toLowerCase() === "apps";
}

function entryMatchesCategory(entry: ArtifactEntry, category: ArtifactCategory) {
  return category.filter.type.includes(entry.type);
}
