import { createContext, useContext, useEffect, useMemo } from "react";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

interface ShellState {
  isSidebarOpen: boolean;
  agentName: string;
  logoUrl: string;
  isArtifactActive: boolean;
  artifactRenderer: () => React.ReactNode;
  setIsSidebarOpen: (isOpen: boolean) => void;
  setAgentName: (name: string) => void;
  setLogoUrl: (url: string) => void;
  setIsArtifactActive: (isActive: boolean) => void;
  setArtifactRenderer: (renderer: () => React.ReactNode) => void;
}

export const createShellStore = ({ logoUrl, agentName }: { logoUrl: string; agentName: string }) =>
  create<ShellState>((set) => ({
    isSidebarOpen: true,
    agentName: agentName,
    logoUrl: logoUrl,
    isArtifactActive: false,
    artifactRenderer: () => null,
    setIsSidebarOpen: (isOpen: boolean) => set({ isSidebarOpen: isOpen }),
    setAgentName: (name: string) => set({ agentName: name }),
    setLogoUrl: (url: string) => set({ logoUrl: url }),
    setIsArtifactActive: (isActive: boolean) => set({ isArtifactActive: isActive }),
    setArtifactRenderer: (renderer: () => React.ReactNode) => set({ artifactRenderer: renderer }),
  }));

export const ShellStoreContext = createContext<ReturnType<typeof createShellStore> | null>(null);

export const useShellStore = <T,>(selector: (state: ShellState) => T): T => {
  const store = useContext(ShellStoreContext);
  if (!store) {
    throw new Error("useShellStore must be used within ShellStoreProvider");
  }

  return store(useShallow(selector));
};

export const ShellStoreProvider = ({
  children,
  agentName,
  logoUrl,
}: {
  children: React.ReactNode;
  logoUrl: string;
  agentName: string;
}) => {
  const shellStore = useMemo(() => createShellStore({ agentName, logoUrl }), []);

  useEffect(() => {
    const { setAgentName, setLogoUrl } = shellStore.getState();
    setAgentName(agentName);
    setLogoUrl(logoUrl);
  }, [agentName, logoUrl]);

  return <ShellStoreContext.Provider value={shellStore}>{children}</ShellStoreContext.Provider>;
};
