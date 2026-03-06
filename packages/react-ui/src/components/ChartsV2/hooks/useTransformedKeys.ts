import { useMemo, useRef } from "react";

let nextKeyId = 0;

export const useTransformedKeys = (keys: string[]) => {
  const cacheRef = useRef<Record<string, string>>({});

  return useMemo(() => {
    return keys.reduce(
      (acc, key) => {
        if (!cacheRef.current[key]) {
          cacheRef.current[key] = `tk-${nextKeyId++}`;
        }
        acc[key] = cacheRef.current[key];
        return acc;
      },
      {} as Record<string, string>,
    );
  }, [keys]);
};
