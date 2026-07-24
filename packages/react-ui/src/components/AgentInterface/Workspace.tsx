import {
  useActiveDetailedView,
  useArtifactCategories,
  useArtifactList,
  useDetailedView,
  useDetailedViewStore,
  type ArtifactEntry,
} from "@openuidev/react-headless";
import clsx from "clsx";
import { useEffect, type ReactNode } from "react";
import { useLayoutContext } from "../../context/LayoutContext";
import {
  formatArtifactUpdatedAt,
  useArtifactIcon,
  useArtifactTypeLabel,
} from "./ArtifactBrowserPage";
import { useAgentInterfaceLabels } from "./_shared/labelsContext";
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
 * - Lists every registered artifact, grouped into one section per
 *   `artifactCategories` entry configured on `<AgentInterface>`; a single
 *   "Artifacts" section lists everything when no categories are configured.
 *   There are no tabs or filtering — the rail shows it all.
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

const DefaultWorkspace = ({ className }: { className?: string }) => {
  const { isWorkspaceOpen, setIsWorkspaceOpen } = useAgentInterfaceStore((state) => ({
    isWorkspaceOpen: state.isWorkspaceOpen,
    setIsWorkspaceOpen: state.setIsWorkspaceOpen,
  }));
  const { isDetailedViewActive } = useActiveDetailedView();
  const { layout } = useLayoutContext();
  const categories = useArtifactCategories();
  const all = useArtifactList();
  const { workspaceToggle } = useAgentInterfaceLabels();
  const entries = latestPerId(all);
  const shouldShowWorkspace = isWorkspaceOpen && !isDetailedViewActive;

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
          <h2 className="openui-agent-workspace-sidebar__title">{workspaceToggle}</h2>
        </div>
        <div className="openui-agent-workspace-sidebar__content">
          {categories.length > 0 ? (
            <WorkspaceSections categories={categories} entries={entries} />
          ) : (
            <WorkspaceSection entries={entries} />
          )}
        </div>
      </div>
    </>
  );
};

const WorkspaceSections = ({
  categories,
  entries,
}: {
  categories: ReturnType<typeof useArtifactCategories>;
  entries: ReadonlyArray<ArtifactEntry>;
}) => {
  // Show every category that has registered entries — no tab filtering.
  const visibleCategories = categories.filter((category) =>
    entries.some((entry) => entryMatchesCategory(entry, category)),
  );
  // Entries matching no configured category are still shown (never dropped),
  // in a fallback section after the categorized ones.
  const uncategorized = entries.filter(
    (entry) => !categories.some((category) => entryMatchesCategory(entry, category)),
  );

  return (
    <>
      {visibleCategories.map((category) => (
        <WorkspaceSection
          key={category.name}
          entries={entries.filter((entry) => entryMatchesCategory(entry, category))}
        />
      ))}
      {uncategorized.length > 0 && (
        <WorkspaceSection key="__uncategorized__" entries={uncategorized} />
      )}
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

function entryMatchesCategory(entry: ArtifactEntry, category: ArtifactCategory) {
  return category.filter.type.includes(entry.type);
}
