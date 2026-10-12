import { createContext, useContext, useEffect, useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { SIDEBAR_OPEN_STORAGE_KEY } from "../storageKeys";

interface AgentInterfaceState {
  isSidebarOpen: boolean;
  /** The desktop open/closed choice; the only field saved to storage. */
  desktopSidebarOpen: boolean;
  isWorkspaceOpen: boolean;
  agentName: string;
  logoUrl: string;
  setIsSidebarOpen: (isOpen: boolean) => void;
  setDesktopSidebarOpen: (isOpen: boolean) => void;
  setIsWorkspaceOpen: (isOpen: boolean) => void;
  setAgentName: (name: string) => void;
  setLogoUrl: (url: string) => void;
}

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
        // Collapsed until storage hydrates (synchronously, on the client) and
        // on the server, where storage can't be read.
        isSidebarOpen: false,
        desktopSidebarOpen: false,
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
        // PrePaintScript reads this shape.
        partialize: (state) => ({ desktopSidebarOpen: state.desktopSidebarOpen }),
        // Open the sidebar the way the user last left it on desktop.
        merge: (persisted, current) => {
          const open =
            (persisted as Partial<AgentInterfaceState> | undefined)?.desktopSidebarOpen === true;
          return { ...current, desktopSidebarOpen: open, isSidebarOpen: open };
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
