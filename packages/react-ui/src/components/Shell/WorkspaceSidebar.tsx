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
import { useEffect } from "react";
import { IconButton } from "../IconButton";
import { useShellStore } from "../_shared/store";

/**
 * Right-side collapsible sidebar that lists the artifacts attached to the
 * current thread (sourced from `useArtifactList`).
 *
 * Sections are driven by the `artifactCategories` configured on
 * `<ChatProvider>`: each category lists the entries whose `type` matches its
 * filter. Without categories, a single "Artifacts" section lists everything.
 *
 * Each item activates the corresponding `DetailedView` when clicked. Use
 * inside the Shell layout — a `ChatProvider` ancestor is required.
 *
 * @category Components
 */
export const WorkspaceSidebar = ({ className }: { className?: string }) => {
  const { isWorkspaceOpen, setIsWorkspaceOpen } = useShellStore((state) => ({
    isWorkspaceOpen: state.isWorkspaceOpen,
    setIsWorkspaceOpen: state.setIsWorkspaceOpen,
  }));
  const { isDetailedViewActive } = useActiveDetailedView();
  const categories = useArtifactCategories();

  // Auto-collapse the workspace when a DetailedView opens (focus on the view);
  // auto-expand when it closes. Fires only on transition, so manual toggles
  // while the active state is unchanged are preserved.
  useEffect(() => {
    setIsWorkspaceOpen(!isDetailedViewActive);
  }, [isDetailedViewActive, setIsWorkspaceOpen]);

  const all = useArtifactList();
  const isEmpty = Object.keys(all).length === 0;

  return (
    <div
      className={clsx(
        "openui-shell-workspace-sidebar",
        { "openui-shell-workspace-sidebar--collapsed": !isWorkspaceOpen },
        className,
      )}
    >
      <div className="openui-shell-workspace-sidebar__header">
        <span className="openui-shell-workspace-sidebar__title">Workspace</span>
        <IconButton
          icon={
            isWorkspaceOpen ? <ArrowRightFromLine size="1em" /> : <ArrowLeftFromLine size="1em" />
          }
          onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
          size="small"
          variant="secondary"
          aria-label={isWorkspaceOpen ? "Collapse workspace" : "Expand workspace"}
          className="openui-shell-workspace-sidebar__toggle-button"
        />
      </div>

      <div className="openui-shell-workspace-sidebar__content">
        {categories.length > 0 ? (
          categories.map((category) => (
            <CategorySection key={category.name} name={category.name} types={category.filter.type} />
          ))
        ) : (
          <WorkspaceSection title="Artifacts" entries={latestPerId(all)} emptyHint="No artifacts yet" />
        )}
        {isEmpty && (
          <div className="openui-shell-workspace-sidebar__empty">
            Artifacts created by the assistant will appear here.
          </div>
        )}
      </div>
    </div>
  );
};

const CategorySection = ({ name, types }: { name: string; types: string[] }) => {
  const entries = useArtifactList({ type: types });
  return (
    <WorkspaceSection title={name} entries={latestPerId(entries)} emptyHint={`No ${name.toLowerCase()} yet`} />
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
      <div className="openui-shell-workspace-sidebar__section">
        <div className="openui-shell-workspace-sidebar__section-header">{title}</div>
        <div className="openui-shell-workspace-sidebar__section-empty">{emptyHint}</div>
      </div>
    );
  }

  return (
    <div className="openui-shell-workspace-sidebar__section">
      <div className="openui-shell-workspace-sidebar__section-header">{title}</div>
      <ul className="openui-shell-workspace-sidebar__list">
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
        className={clsx("openui-shell-workspace-sidebar__item", {
          "openui-shell-workspace-sidebar__item--active": isActive,
        })}
      >
        <FileText size={14} className="openui-shell-workspace-sidebar__item-icon" />
        <span className="openui-shell-workspace-sidebar__item-label">{entry.heading}</span>
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
