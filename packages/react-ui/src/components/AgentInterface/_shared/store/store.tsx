import { createContext, useContext, useEffect, useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { useIsomorphicLayoutEffect } from "../../../Charts/hooks/core/useIsomorphicLayoutEffect";

interface AgentInterfaceState {
  isSidebarOpen: boolean;
  /** The desktop open/closed choice; the only field saved to storage. */
  desktopSidebarOpen: boolean;
  /** True once the saved desktop choice has been read from storage. */
  hasRestoredSidebar: boolean;
  isWorkspaceOpen: boolean;
  agentName: string;
  logoUrl: string;
  setIsSidebarOpen: (isOpen: boolean) => void;
  setDesktopSidebarOpen: (isOpen: boolean) => void;
  setIsWorkspaceOpen: (isOpen: boolean) => void;
  setAgentName: (name: string) => void;
  setLogoUrl: (url: string) => void;
}

/**
 * Storage key for the persisted desktop sidebar choice. Kept separate from
 * `isSidebarOpen` so opening the drawer on mobile isn't remembered on desktop.
 */
export const SIDEBAR_OPEN_STORAGE_KEY = "openui-agent-sidebar-open";

export const createAgentInterfaceStore = ({
  logoUrl,
  agentName,
}: {
  logoUrl: string;
  agentName: string;
}) =>
  create<AgentInterfaceState>()(
    persist(
      (set) => ({
        // Collapsed until the saved choice is restored after mount, so the
        // server and the client's first render produce the same markup.
        isSidebarOpen: false,
        desktopSidebarOpen: false,
        hasRestoredSidebar: false,
        isWorkspaceOpen: false,
        agentName: agentName,
        logoUrl: logoUrl,
        setIsSidebarOpen: (isOpen: boolean) => set({ isSidebarOpen: isOpen }),
        setDesktopSidebarOpen: (isOpen: boolean) => set({ desktopSidebarOpen: isOpen }),
        setIsWorkspaceOpen: (isOpen: boolean) => set({ isWorkspaceOpen: isOpen }),
        setAgentName: (name: string) => set({ agentName: name }),
        setLogoUrl: (url: string) => set({ logoUrl: url }),
      }),
      {
        name: SIDEBAR_OPEN_STORAGE_KEY,
        storage: createJSONStorage(() => localStorage),
        // Restored by AgentInterfaceStoreProvider after hydration, before
        // paint; SidebarContainer applies it (desktop only, without animating)
        // and Container stays hidden until then.
        skipHydration: true,
        partialize: (state) => ({ desktopSidebarOpen: state.desktopSidebarOpen }),
        merge: (persisted, current) => ({
          ...current,
          desktopSidebarOpen:
            (persisted as Partial<AgentInterfaceState> | undefined)?.desktopSidebarOpen === true,
          hasRestoredSidebar: true,
        }),
      },
    ),
  );

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

  // After hydration, before paint. `persist` is missing when storage is
  // unavailable; mark it restored anyway so the interface is revealed.
  useIsomorphicLayoutEffect(() => {
    if (shellStore.persist) void shellStore.persist.rehydrate();
    else shellStore.setState({ hasRestoredSidebar: true });
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
