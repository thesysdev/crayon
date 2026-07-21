import React, { useEffect, useState } from "react";

type SyncExternalStoreHook = <Snapshot>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => Snapshot,
  getServerSnapshot?: () => Snapshot,
) => Snapshot;

const nativeUseInsertionEffect = (React as unknown as { useInsertionEffect?: typeof useEffect })
  .useInsertionEffect;

const nativeUseSyncExternalStore = (
  React as unknown as {
    useSyncExternalStore?: SyncExternalStoreHook;
  }
).useSyncExternalStore;

export const useInsertionEffectCompat = nativeUseInsertionEffect ?? useEffect;

function useSyncExternalStoreFallback<Snapshot>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => Snapshot,
): Snapshot {
  const [snapshot, setSnapshot] = useState(() => getSnapshot());

  useEffect(() => {
    const handleStoreChange = () => {
      setSnapshot(() => getSnapshot());
    };

    handleStoreChange();
    return subscribe(handleStoreChange);
  }, [subscribe, getSnapshot]);

  return snapshot;
}

export function useSyncExternalStoreCompat<Snapshot>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => Snapshot,
  getServerSnapshot?: () => Snapshot,
): Snapshot {
  if (nativeUseSyncExternalStore) {
    return nativeUseSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  }
  return useSyncExternalStoreFallback(subscribe, getSnapshot);
}
