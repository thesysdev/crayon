import { createContext, useContext, useEffect, useMemo } from "react";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { useIsomorphicLayoutEffect } from "../../../Charts/hooks/core/useIsomorphicLayoutEffect";

interface AgentInterfaceState {
  isSidebarOpen: boolean;
  /**
   * True once hydrated (set before the first paint). Saved preferences are
   * read from then on, so server and client first renders match.
   */
  isHydrated: boolean;
  isWorkspaceOpen: boolean;
  agentName: string;
  logoUrl: string;
  setIsSidebarOpen: (isOpen: boolean) => void;
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
  create<AgentInterfaceState>((set) => ({
    // Collapsed until hydrated, so the server and the client's first render
    // produce the same markup; SidebarContainer then restores the saved choice.
    isSidebarOpen: false,
    isHydrated: false,
    isWorkspaceOpen: false,
    agentName: agentName,
    logoUrl: logoUrl,
    setIsSidebarOpen: (isOpen: boolean) => set({ isSidebarOpen: isOpen }),
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

  // Hydrated, before paint: SidebarContainer restores the saved sidebar state
  // and Container reveals its contents.
  useIsomorphicLayoutEffect(() => {
    shellStore.setState({ isHydrated: true });
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
