import {
  useActiveDetailedView,
  useArtifactCategories,
  useArtifactList,
  useDetailedView,
  useDetailedViewStore,
  type ArtifactEntry,
} from "@openuidev/react-headless";
import clsx from "clsx";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  ArtifactPreviewIllustration,
  formatArtifactUpdatedAt,
  getArtifactPreviewKind,
  getArtifactTypeLabel,
} from "./ArtifactBrowserPage";
import { useLayoutContext } from "../../context/LayoutContext";
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
 * - **Auto-shows on the first registered artifact** and renders nothing while
 *   the registry is empty — drop-in users without artifact renderers never
 *   see it.
 * - Sections are driven by the `artifactCategories` configured on
 *   `<AgentInterface>`; a single "Artifacts" section lists everything when no
 *   categories are configured.
 * - Item click activates the corresponding DetailedView; the rail
 *   auto-collapses while a DetailedView is open.
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
  const all = useArtifactList();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("all");

  // Auto-collapse the rail when a DetailedView opens (focus on the view);
  // auto-expand when it closes. Fires only on transition, so manual toggles
  // while the active state is unchanged are preserved.
  useEffect(() => {
    if (layout === "mobile") return;
    setIsWorkspaceOpen(!isDetailedViewActive);
  }, [isDetailedViewActive, layout, setIsWorkspaceOpen]);

  // Auto-show on first artifact: nothing renders while the registry is empty.
  if (Object.keys(all).length === 0) return null;

  return (
    <>
      {layout === "mobile" && (
        <div
          className={clsx("openui-agent-workspace-sidebar__overlay", {
            "openui-agent-workspace-sidebar__overlay--collapsed": !isWorkspaceOpen,
          })}
          onClick={() => setIsWorkspaceOpen(false)}
        />
      )}
      <div
        className={clsx(
          "openui-agent-workspace-sidebar",
          { "openui-agent-workspace-sidebar--collapsed": !isWorkspaceOpen },
          className,
        )}
      >
        <div className="openui-agent-workspace-sidebar__header">
          <WorkspaceTabs activeTab={activeTab} onChange={setActiveTab} />
        </div>

        <div className="openui-agent-workspace-sidebar__content">
          {categories.length > 0 ? (
            <WorkspaceSections categories={categories} activeTab={activeTab} />
          ) : activeTab === "all" || activeTab === "artifacts" ? (
            <WorkspaceSection title="Artifacts" entries={latestPerId(all)} emptyHint="No artifacts yet" />
          ) : (
            <WorkspaceSection title="Apps" entries={[]} emptyHint="No apps yet" />
          )}
        </div>
      </div>
    </>
  );
};

const WORKSPACE_TABS: Array<{ value: WorkspaceTab; label: string }> = [
  { value: "all", label: "All" },
  { value: "artifacts", label: "Artifacts" },
  { value: "apps", label: "Apps" },
];

const WorkspaceTabs = ({
  activeTab,
  onChange,
}: {
  activeTab: WorkspaceTab;
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
      {WORKSPACE_TABS.map((tab) => (
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
  activeTab,
}: {
  categories: ReturnType<typeof useArtifactCategories>;
  activeTab: WorkspaceTab;
}) => {
  const visibleCategories = categories.filter((category) => {
    const normalizedName = category.name.toLowerCase();
    if (activeTab === "all") return true;
    if (activeTab === "apps") return normalizedName === "apps";
    return normalizedName !== "apps";
  });

  if (visibleCategories.length === 0) {
    const title = activeTab === "apps" ? "Apps" : "Artifacts";
    return <WorkspaceSection entries={[]} emptyHint={`No ${title.toLowerCase()} yet`} />;
  }

  return (
    <>
      {visibleCategories.map((category) => (
        <CategorySection
          key={category.name}
          name={category.name}
          types={category.filter.type}
          showEmpty={activeTab !== "all"}
        />
      ))}
    </>
  );
};

const CategorySection = ({
  name,
  types,
  showEmpty,
}: {
  name: string;
  types: string[];
  showEmpty: boolean;
}) => {
  const entries = useArtifactList({ type: types });
  return (
    <WorkspaceSection
      entries={latestPerId(entries)}
      emptyHint={showEmpty ? `No ${name.toLowerCase()} yet` : undefined}
    />
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
  const previewKind = getArtifactPreviewKind(entry);
  const updatedAt = formatArtifactUpdatedAt(entry.updatedAt);
  const metadata = [getArtifactTypeLabel(entry), updatedAt].filter(Boolean).join(" · ");

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
        <ArtifactPreviewIllustration kind={previewKind} title={entry.heading} />
        <span className="openui-agent-workspace-sidebar__item-body">
          <span className="openui-agent-workspace-sidebar__item-label">{entry.heading}</span>
          {metadata && <span className="openui-agent-workspace-sidebar__item-meta">{metadata}</span>}
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
