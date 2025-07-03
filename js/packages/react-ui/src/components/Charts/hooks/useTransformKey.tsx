import { useMemo } from "react";

export const useTransformedKeys = (keys: string[]) => {
  return useMemo(() => {
    return keys.reduce(
      (acc, key) => {
        const transformedKey = crypto.randomUUID();
        acc[key] = transformedKey;
        return acc;
      },
      {} as Record<string, string>,
    );
  }, [keys]);
};
