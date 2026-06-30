import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface NavContextValue {
  /** Current path. `undefined` means the thread region is active (no Route matched). */
  path: string | undefined;
  /** Switch path. Pass `undefined` to clear and return to the thread view. */
  navigate: (next: string | undefined) => void;
}

const NavContext = createContext<NavContextValue | null>(null);

export interface NavProviderProps {
  /** Controlled current path. Provide together with `onNavigate`. */
  path?: string;
  /** Initial path for uncontrolled mode. Ignored when `onNavigate` is provided. */
  defaultPath?: string;
  /** Called when navigation occurs. Presence determines controlled mode. */
  onNavigate?: (next: string | undefined) => void;
  children: ReactNode;
}

/**
 * Standard controlled/uncontrolled split:
 * - `onNavigate` provided → controlled. Parent owns state; `path` prop is the source of truth.
 * - `onNavigate` absent → uncontrolled. Internal state starts at `defaultPath`.
 */
export const NavProvider = ({ path, defaultPath, onNavigate, children }: NavProviderProps) => {
  const isControlled = onNavigate !== undefined;
  const [internalPath, setInternalPath] = useState<string | undefined>(defaultPath);

  const currentPath = isControlled ? path : internalPath;

  const navigate = useCallback(
    (next: string | undefined) => {
      if (isControlled) {
        onNavigate?.(next);
      } else {
        setInternalPath(next);
      }
    },
    [isControlled, onNavigate],
  );

  const value = useMemo<NavContextValue>(
    () => ({ path: currentPath, navigate }),
    [currentPath, navigate],
  );

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
};

/**
 * Read the current navigation state from inside <AgentInterface>.
 *
 * Returns `{ path, navigate }`. Call `navigate(undefined)` to return to the
 * thread view (clears any active route).
 */
export const useNav = (): NavContextValue => {
  const ctx = useContext(NavContext);
  if (!ctx) {
    throw new Error("useNav() must be used inside <AgentInterface>");
  }
  return ctx;
};

/** Returns the nav context if mounted, otherwise null. Internal use. */
export const useOptionalNav = (): NavContextValue | null => useContext(NavContext);
