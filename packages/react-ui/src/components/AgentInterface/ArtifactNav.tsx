import { useArtifactCategories, useArtifactStorage } from "@openuidev/react-headless";
import { Boxes } from "lucide-react";
import type { ReactNode } from "react";
import { artifactListPath } from "./_shared/artifactPaths";
import { useOptionalNav } from "./_shared/navContext";
import { SidebarItem } from "./SidebarItem";

export interface ArtifactNavProps {
  className?: string;
  /** Leading icon for every category item. Defaults to a boxes icon. */
  icon?: ReactNode;
}

/**
 * Sidebar navigation for the global artifact browser.
 *
 * Renders one {@link SidebarItem} per configured `artifactCategories` entry
 * (or a single "Artifacts" item when no categories are configured). Clicking
 * navigates to the reserved `artifacts/{category}` path, which AgentInterface
 * renders as the searchable artifact browser in the thread region.
 *
 * Renders nothing when `storage.artifact` is not configured.
 *
 * Included automatically in the default sidebar; compose it manually inside
 * a custom `<AgentInterface.Sidebar>`.
 *
 * @category Components
 */
export const ArtifactNav = ({ className, icon }: ArtifactNavProps) => {
  const storage = useArtifactStorage();
  const categories = useArtifactCategories();
  const nav = useOptionalNav();

  if (!storage) return null;

  const items =
    categories.length > 0
      ? categories.map((c) => ({ label: c.name, path: artifactListPath(c.name) }))
      : [{ label: "Artifacts", path: artifactListPath() }];

  return (
    <div className={className}>
      {items.map((item) => (
        <SidebarItem
          key={item.path}
          path={item.path}
          icon={icon ?? <Boxes size={14} />}
          // Highlight on the list page AND while viewing an artifact within it.
          selected={nav?.path === item.path || nav?.path?.startsWith(`${item.path}/`) === true}
        >
          {item.label}
        </SidebarItem>
      ))}
    </div>
  );
};
