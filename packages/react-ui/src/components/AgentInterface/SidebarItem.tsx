import clsx from "clsx";
import type { ComponentPropsWithoutRef, MouseEventHandler, ReactNode } from "react";
import { useLayoutContext } from "../../context/LayoutContext";
import { useOptionalSidebarVisualState } from "./Sidebar";
import { SidebarTooltip } from "./SidebarTooltip";
import { useOptionalNav } from "./_shared/navContext";
import { useAgentInterfaceStore } from "./_shared/store";

export interface SidebarItemProps extends Omit<ComponentPropsWithoutRef<"button">, "children"> {
  /** Leading icon. */
  icon?: ReactNode;
  /** Trailing content — badges, counts, etc. Rendered right-aligned. */
  trailing?: ReactNode;
  /**
   * Selected/active state. Defaults to `currentPath === path` when `path` is
   * provided. Pass explicitly to override the auto-derivation.
   */
  selected?: boolean;
  /**
   * Path this item navigates to. When provided, clicking the item calls
   * `navigate(path)` and the item auto-selects when current path matches.
   * Works in both controlled and uncontrolled <AgentInterface>.
   */
  path?: string;
  children: ReactNode;
}

/**
 * Styled clickable item for use inside <AgentInterface.Sidebar>. Visually
 * matches the ThreadList row so custom nav items blend with the default
 * thread list.
 */
export const SidebarItem = ({
  icon,
  trailing,
  selected,
  path,
  className,
  children,
  onClick,
  ...rest
}: SidebarItemProps) => {
  const nav = useOptionalNav();
  const layoutCtx = useLayoutContext();
  const setIsSidebarOpen = useAgentInterfaceStore((s) => s.setIsSidebarOpen);
  const sidebarVisualState = useOptionalSidebarVisualState();
  const isCollapsedLayout = sidebarVisualState?.isCollapsedLayout ?? false;

  const isActive = selected !== undefined ? selected : path !== undefined && nav?.path === path;

  const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (path !== undefined && nav) {
      nav.navigate(path);
      if (layoutCtx?.layout === "mobile") {
        setIsSidebarOpen(false);
      }
    }
  };

  const button = (
    <button
      type="button"
      className={clsx(
        "openui-agent-sidebar-item",
        { "openui-agent-sidebar-item--selected": isActive },
        className,
      )}
      onClick={handleClick}
      {...rest}
    >
      {icon !== undefined && <span className="openui-agent-sidebar-item__icon">{icon}</span>}
      <span className="openui-agent-sidebar-item__label">{children}</span>
      {trailing !== undefined && (
        <span className="openui-agent-sidebar-item__trailing">{trailing}</span>
      )}
    </button>
  );

  return (
    <SidebarTooltip content={children} disabled={!isCollapsedLayout}>
      {button}
    </SidebarTooltip>
  );
};
