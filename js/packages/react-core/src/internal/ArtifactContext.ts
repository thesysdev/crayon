import { createContext, useContext } from "react";
import { StoreApi, useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { createStore } from "zustand/vanilla";

interface ArtifactStoreState {
  activeArtifact: { artifactId: string } | null;
  artifactHTMLNode: HTMLElement | null;
}

interface ArtifactStoreActions {
  setActiveArtifact: (artifactId: string) => void;
  clearActiveArtifact: () => void;
  setArtifactHTMLNode: (node: HTMLElement | null) => void;
}

export type ArtifactStore = ArtifactStoreState & ArtifactStoreActions;

export const createArtifactStore = () =>
  createStore<ArtifactStore>((set) => ({
    activeArtifact: null,
    artifactHTMLNode: null,
    setActiveArtifact: (artifactId: string) => set({ activeArtifact: { artifactId } }),
    clearActiveArtifact: () => set({ activeArtifact: null }),
    setArtifactHTMLNode: (node: HTMLElement | null) => set({ artifactHTMLNode: node }),
  }));

export const ArtifactStoreContext = createContext<StoreApi<ArtifactStore> | null>(null);

export const useArtifactStore = <T,>(selector: (state: ArtifactStore) => T): T => {
  const store = useContext(ArtifactStoreContext);
  if (!store) {
    throw new Error("useArtifactStore must be used within ArtifactProvider");
  }
  return useStore(store, useShallow(selector));
};
