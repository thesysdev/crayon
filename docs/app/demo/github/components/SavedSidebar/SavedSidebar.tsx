import { Plus, Trash2 } from "lucide-react";
import type { SavedDashboard } from "../../saved/store";
import "./SavedSidebar.css";

type SavedSidebarProps = {
  dashboards: SavedDashboard[];
  activeId: string | null;
  onSelect: (dashboard: SavedDashboard) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
};

export function SavedSidebar({
  dashboards,
  activeId,
  onSelect,
  onDelete,
  onNew,
}: SavedSidebarProps) {
  return (
    <aside className="saved-sidebar">
      <button className="saved-sidebar-new" onClick={onNew}>
        <Plus size={14} strokeWidth={2} />
        New dashboard
      </button>
      <div className="saved-sidebar-list">
        {dashboards.map((d) => (
          <div
            key={d.id}
            className={`saved-sidebar-item ${d.id === activeId ? "saved-sidebar-item-active" : ""}`}
            onClick={() => onSelect(d)}
          >
            <img
              src={`https://github.com/${d.username}.png?size=32`}
              alt=""
              className="saved-sidebar-avatar"
            />
            <div className="saved-sidebar-item-text">
              <span className="saved-sidebar-item-name">{d.title}</span>
              <span className="saved-sidebar-item-meta">@{d.username}</span>
            </div>
            <button
              className="saved-sidebar-delete"
              title="Delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(d.id);
              }}
            >
              <Trash2 size={13} strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
