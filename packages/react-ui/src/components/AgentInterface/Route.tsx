import type { ReactNode } from "react";

export interface RouteProps {
  /** Exact path match (no wildcards or params in v1). */
  path: string;
  /** Content shown in the thread region when this route is active. */
  children?: ReactNode;
}

/**
 * Slot marker for a routable view. Never rendered directly — the parent
 * <AgentInterface> extracts all Routes from its children, finds the one
 * whose `path` matches the current nav state, and renders that Route's
 * children in place of the entire thread region (MobileHeader, ThreadHeader,
 * ScrollArea/Messages, Composer all hidden).
 *
 * Use multiple <AgentInterface.Route> siblings to define separate views.
 * When no Route matches, the thread region renders normally.
 */
export const Route = (_props: RouteProps) => null;
Route.displayName = "AgentInterface.Route";
