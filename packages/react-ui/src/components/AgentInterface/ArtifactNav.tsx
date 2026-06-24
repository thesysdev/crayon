import { useArtifactCategories, useArtifactStorage } from "@openuidev/react-headless";
import { Boxes } from "lucide-react";
import type { ReactNode } from "react";
import { artifactListPath } from "./_shared/artifactPaths";
import { useOptionalNav } from "./_shared/navContext";
import { SidebarItem } from "./SidebarItem";

export interface ArtifactNavProps {
  className?: string;
  /**
   * Fallback icon for category items that don't set their own `icon`.
   * Defaults to a boxes icon.
   */
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
 * Each item's icon is the category's own `icon` (`artifactCategories: [{ icon }]`),
 * else the `icon` prop, else a generic default — the library hardcodes no
 * per-category icons.
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
      ? categories.map((c) => ({
          label: c.name,
          path: artifactListPath(c.name),
          categoryIcon: c.icon,
        }))
      : [{ label: "Artifacts", path: artifactListPath(), categoryIcon: undefined as ReactNode }];

  // Category nav icon: the category's own icon → the `icon` prop → a generic default.
  const getItemIcon = (categoryIcon: ReactNode): ReactNode =>
    categoryIcon ?? icon ?? <Boxes size="1em" />;

  // NOTE: category styling hooks are still name-based (a separate concern from the
  // icon; these classes drive per-category icon backgrounds in sidebar.scss).
  const getItemClassName = (label: string) => {
    const normalizedLabel = label.toLowerCase();
    if (normalizedLabel === "apps") return "openui-agent-sidebar-item--apps";
    if (normalizedLabel === "reports" || normalizedLabel === "artifacts") {
      return "openui-agent-sidebar-item--artifacts";
    }
    return undefined;
  };

  return (
    <div className={className}>
      {items.map((item) => (
        <SidebarItem
          key={item.path}
          path={item.path}
          icon={getItemIcon(item.categoryIcon)}
          className={getItemClassName(item.label)}
          // Highlight on the list page AND while viewing an artifact within it.
          selected={nav?.path === item.path || nav?.path?.startsWith(`${item.path}/`) === true}
        >
          {item.label}
        </SidebarItem>
      ))}
    </div>
  );
};
