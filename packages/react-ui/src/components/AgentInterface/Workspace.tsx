import {
  useActiveDetailedView,
  useArtifactCategories,
  useArtifactList,
  useDetailedView,
  useDetailedViewStore,
  type ArtifactEntry,
} from "@openuidev/react-headless";
import clsx from "clsx";
import { ArrowLeftFromLine, ArrowRightFromLine, FileText } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { IconButton } from "../IconButton";
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

const DefaultWorkspace = ({ className }: { className?: string }) => {
  const { isWorkspaceOpen, setIsWorkspaceOpen } = useAgentInterfaceStore((state) => ({
    isWorkspaceOpen: state.isWorkspaceOpen,
    setIsWorkspaceOpen: state.setIsWorkspaceOpen,
  }));
  const { isDetailedViewActive } = useActiveDetailedView();
  const categories = useArtifactCategories();
  const all = useArtifactList();

  // Auto-collapse the rail when a DetailedView opens (focus on the view);
  // auto-expand when it closes. Fires only on transition, so manual toggles
  // while the active state is unchanged are preserved.
  useEffect(() => {
    setIsWorkspaceOpen(!isDetailedViewActive);
  }, [isDetailedViewActive, setIsWorkspaceOpen]);

  // Auto-show on first artifact: nothing renders while the registry is empty.
  if (Object.keys(all).length === 0) return null;

  return (
    <div
      className={clsx(
        "openui-agent-workspace-sidebar",
        { "openui-agent-workspace-sidebar--collapsed": !isWorkspaceOpen },
        className,
      )}
    >
      <div className="openui-agent-workspace-sidebar__header">
        <span className="openui-agent-workspace-sidebar__title">Workspace</span>
        <IconButton
          icon={
            isWorkspaceOpen ? <ArrowRightFromLine size="1em" /> : <ArrowLeftFromLine size="1em" />
          }
          onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
          size="small"
          variant="secondary"
          aria-label={isWorkspaceOpen ? "Collapse workspace" : "Expand workspace"}
          className="openui-agent-workspace-sidebar__toggle-button"
        />
      </div>

      <div className="openui-agent-workspace-sidebar__content">
        {categories.length > 0 ? (
          categories.map((category) => (
            <CategorySection
              key={category.name}
              name={category.name}
              types={category.filter.type}
            />
          ))
        ) : (
          <WorkspaceSection title="Artifacts" entries={latestPerId(all)} emptyHint="No artifacts yet" />
        )}
      </div>
    </div>
  );
};

const CategorySection = ({ name, types }: { name: string; types: string[] }) => {
  const entries = useArtifactList({ type: types });
  return (
    <WorkspaceSection
      title={name}
      entries={latestPerId(entries)}
      emptyHint={`No ${name.toLowerCase()} yet`}
    />
  );
};

const WorkspaceSection = ({
  title,
  entries,
  emptyHint,
}: {
  title: string;
  entries: ReadonlyArray<ArtifactEntry>;
  emptyHint: string;
}) => {
  if (entries.length === 0) {
    return (
      <div className="openui-agent-workspace-sidebar__section">
        <div className="openui-agent-workspace-sidebar__section-header">{title}</div>
        <div className="openui-agent-workspace-sidebar__section-empty">{emptyHint}</div>
      </div>
    );
  }

  return (
    <div className="openui-agent-workspace-sidebar__section">
      <div className="openui-agent-workspace-sidebar__section-header">{title}</div>
      <ul className="openui-agent-workspace-sidebar__list">
        {entries.map((entry) => (
          <WorkspaceItem key={entry.id} entry={entry} />
        ))}
      </ul>
    </div>
  );
};

const WorkspaceItem = ({ entry }: { entry: ArtifactEntry }) => {
  const viewId = `${entry.id}:${entry.version}`;
  const { isActive } = useDetailedView(viewId);
  const store = useDetailedViewStore();
  const onClick = () => store.getState().setActiveDetailedView(viewId);

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
        <FileText size={14} className="openui-agent-workspace-sidebar__item-icon" />
        <span className="openui-agent-workspace-sidebar__item-label">{entry.heading}</span>
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
