import { createContext, useContext, useEffect, useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { useIsomorphicLayoutEffect } from "../../../Charts/hooks/core/useIsomorphicLayoutEffect";

interface AgentInterfaceState {
  isSidebarOpen: boolean;
  /** The desktop open/closed choice; saved to storage. */
  savedDesktopSidebarOpen: boolean;
  /** The dragged sidebar width in px (null until resized); saved to storage. */
  savedSidebarWidth: number | null;
  /** True once the saved sidebar preferences have been read from storage. */
  hasRestoredSidebar: boolean;
  isWorkspaceOpen: boolean;
  agentName: string;
  logoUrl: string;
  setIsSidebarOpen: (isOpen: boolean) => void;
  setSavedDesktopSidebarOpen: (isOpen: boolean) => void;
  setSavedSidebarWidth: (width: number) => void;
  setIsWorkspaceOpen: (isOpen: boolean) => void;
  setAgentName: (name: string) => void;
  setLogoUrl: (url: string) => void;
}

/**
 * Storage key for the persisted sidebar preferences (desktop open state and
 * width). The open state is kept apart from `isSidebarOpen` so opening the
 * drawer on mobile isn't remembered on desktop.
 */
const SIDEBAR_STORAGE_KEY = "openui-agent-sidebar";

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
        savedDesktopSidebarOpen: false,
        savedSidebarWidth: null,
        hasRestoredSidebar: false,
        isWorkspaceOpen: false,
        agentName: agentName,
        logoUrl: logoUrl,
        setIsSidebarOpen: (isOpen: boolean) => set({ isSidebarOpen: isOpen }),
        setSavedDesktopSidebarOpen: (isOpen: boolean) => set({ savedDesktopSidebarOpen: isOpen }),
        setSavedSidebarWidth: (width: number) => set({ savedSidebarWidth: width }),
        setIsWorkspaceOpen: (isOpen: boolean) => set({ isWorkspaceOpen: isOpen }),
        setAgentName: (name: string) => set({ agentName: name }),
        setLogoUrl: (url: string) => set({ logoUrl: url }),
      }),
      {
        name: SIDEBAR_STORAGE_KEY,
        storage: createJSONStorage(() => localStorage),
        // Restored by AgentInterfaceStoreProvider after hydration, before
        // paint; SidebarContainer applies it (desktop only, without animating)
        // and Container stays hidden until then.
        skipHydration: true,
        partialize: (state) => ({
          savedDesktopSidebarOpen: state.savedDesktopSidebarOpen,
          savedSidebarWidth: state.savedSidebarWidth,
        }),
        merge: (persisted, current) => {
          const saved = persisted as Partial<AgentInterfaceState> | undefined;
          return {
            ...current,
            savedDesktopSidebarOpen: saved?.savedDesktopSidebarOpen === true,
            // Range-checked where it's applied (SidebarResizeEdge).
            savedSidebarWidth:
              typeof saved?.savedSidebarWidth === "number" ? saved.savedSidebarWidth : null,
            hasRestoredSidebar: true,
          };
        },
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
