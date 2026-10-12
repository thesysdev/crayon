import { createContext, useContext, useEffect, useMemo } from "react";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { readPreference, writePreference } from "../../../../utils/preferences";
import { useIsomorphicLayoutEffect } from "../../../Charts/hooks/core/useIsomorphicLayoutEffect";

interface AgentInterfaceState {
  isSidebarOpen: boolean;
  /** The desktop open/closed choice; saved as a preference. */
  savedDesktopSidebarOpen: boolean;
  /** True once the saved choice has been read (just after hydration). */
  hasRestoredSidebar: boolean;
  isWorkspaceOpen: boolean;
  agentName: string;
  logoUrl: string;
  setIsSidebarOpen: (isOpen: boolean) => void;
  setSavedDesktopSidebarOpen: (isOpen: boolean) => void;
  setIsWorkspaceOpen: (isOpen: boolean) => void;
  setAgentName: (name: string) => void;
  setLogoUrl: (url: string) => void;
}

/**
 * Saved desktop sidebar choice. Kept apart from `isSidebarOpen` so opening the
 * drawer on mobile isn't remembered on desktop.
 */
const SIDEBAR_OPEN_KEY = "openui-agent-sidebar-open";

export const createAgentInterfaceStore = ({
  logoUrl,
  agentName,
}: {
  logoUrl: string;
  agentName: string;
}) =>
  create<AgentInterfaceState>((set) => ({
    // Collapsed until the saved choice is restored after hydration, so the
    // server and the client's first render produce the same markup.
    isSidebarOpen: false,
    savedDesktopSidebarOpen: false,
    hasRestoredSidebar: false,
    isWorkspaceOpen: false,
    agentName: agentName,
    logoUrl: logoUrl,
    setIsSidebarOpen: (isOpen: boolean) => set({ isSidebarOpen: isOpen }),
    setSavedDesktopSidebarOpen: (isOpen: boolean) => {
      set({ savedDesktopSidebarOpen: isOpen });
      writePreference(SIDEBAR_OPEN_KEY, isOpen);
    },
    setIsWorkspaceOpen: (isOpen: boolean) => set({ isWorkspaceOpen: isOpen }),
    setAgentName: (name: string) => set({ agentName: name }),
    setLogoUrl: (url: string) => set({ logoUrl: url }),
  }));

export const AgentInterfaceStoreContext = createContext<ReturnType<
  typeof createAgentInterfaceStore
> | null>(null);

export const useAgentInterfaceStore = <T,>(selector: (state: AgentInterfaceState) => T): T => {
  const store = useContext(AgentInterfaceStoreContext);
  if (!store) {
    throw new Error("useAgentInterfaceStore must be used within AgentInterfaceStoreProvider");
  }

  return store(useShallow(selector));
};

export const AgentInterfaceStoreProvider = ({
  children,
  agentName,
  logoUrl,
}: {
  children: React.ReactNode;
  logoUrl: string;
  agentName: string;
}) => {
  const shellStore = useMemo(() => createAgentInterfaceStore({ agentName, logoUrl }), []);

  // After hydration, before paint: restore the saved choice. SidebarContainer
  // applies it (desktop only, without animating) and Container stays hidden
  // until then.
  useIsomorphicLayoutEffect(() => {
    shellStore.setState({
      savedDesktopSidebarOpen: readPreference<boolean>(SIDEBAR_OPEN_KEY) === true,
      hasRestoredSidebar: true,
    });
  }, [shellStore]);

  useEffect(() => {
    const { setAgentName, setLogoUrl } = shellStore.getState();
    setAgentName(agentName);
    setLogoUrl(logoUrl);
  }, [agentName, logoUrl]);

  return (
    <AgentInterfaceStoreContext.Provider value={shellStore}>
      {children}
    </AgentInterfaceStoreContext.Provider>
  );
};
