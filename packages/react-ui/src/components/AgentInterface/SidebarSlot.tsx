import type { ReactNode } from "react";

export interface SidebarSlotProps {
  children?: ReactNode;
}

/**
 * Slot marker for the entire sidebar region. Never rendered directly — the
 * parent <AgentInterface> extracts its children and arranges them inside the
 * SidebarContainer in place of the default sidebar arrangement.
 *
 * Mode A: omitted → default sidebar renders (SidebarHeader + SidebarContent
 *         with SidebarSeparator + ThreadList).
 * Mode C: provided with children → children replace the entire sidebar's
 *         inner content (user composes SidebarHeader, SidebarSeparator,
 *         ThreadList, etc. as needed).
 */
export const SidebarSlot = (_props: SidebarSlotProps) => null;
SidebarSlot.displayName = "AgentInterface.Sidebar";
