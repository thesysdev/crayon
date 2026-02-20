import { FC, useEffect, useMemo, useRef } from "react";
import { useThreadListState } from "./hooks/useThreadListState";
import { ArtifactStoreContext, createArtifactStore } from "./internal/ArtifactContext";

export const ArtifactProvider: FC<React.PropsWithChildren> = ({ children }) => {
  const store = useMemo(() => createArtifactStore(), []);

  const { selectedThreadId } = useThreadListState();
  const prevThreadId = useRef(selectedThreadId);

  useEffect(() => {
    if (prevThreadId.current !== selectedThreadId) {
      store.getState().clearActiveArtifact();
      prevThreadId.current = selectedThreadId;
    }
  }, [selectedThreadId, store]);

  return <ArtifactStoreContext.Provider value={store}>{children}</ArtifactStoreContext.Provider>;
};
