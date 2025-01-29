import { createContext, useContext, useEffect, useMemo } from "react";
import { create } from "zustand";
import { useShallow } from "zustand/shallow";

interface ShellState {
  isSidebarOpen: boolean;
  agentName: string;
  logoUrl: string;
  setIsSidebarOpen: (isOpen: boolean) => void;
  setAgentName: (name: string) => void;
  setLogoUrl: (url: string) => void;
}

export const createShellStore = () =>
  create<ShellState>((set) => ({
    isSidebarOpen: true,
    agentName: "",
    logoUrl: "",

    setIsSidebarOpen: (isOpen: boolean) => set({ isSidebarOpen: isOpen }),
    setAgentName: (name: string) => set({ agentName: name }),
    setLogoUrl: (url: string) => set({ logoUrl: url }),
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
  const shellStore = useMemo(() => createShellStore(), []);
  useEffect(() => {
    const { setAgentName, setLogoUrl } = shellStore.getState();
    setAgentName(agentName);
    setLogoUrl(logoUrl);
  }, [agentName, logoUrl]);

  return <ShellStoreContext.Provider value={shellStore}>{children}</ShellStoreContext.Provider>;
};
