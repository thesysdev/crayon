import { useMemo, useRef } from "react";

export const useTransformedKeys = (keys: string[]) => {
  // Use a ref to maintain a stable cache of key -> UUID mappings
  const cacheRef = useRef<Record<string, string>>({});

  return useMemo(() => {
    return keys.reduce(
      (acc, key) => {
        // Only generate a new UUID if we don't already have one for this key
        if (!cacheRef.current[key]) {
          cacheRef.current[key] = crypto.randomUUID();
        }
        acc[key] = cacheRef.current[key];
        return acc;
      },
      {} as Record<string, string>,
    );
  }, [keys]);
};
