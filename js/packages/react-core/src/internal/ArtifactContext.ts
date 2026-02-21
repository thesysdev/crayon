import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { createStore } from "zustand/vanilla";
import { useChatContext } from "./ChatContext";

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

export const useArtifactStore = <T,>(selector: (state: ArtifactStore) => T): T => {
  const { artifactStore } = useChatContext();
  return useStore(artifactStore, useShallow(selector));
};
