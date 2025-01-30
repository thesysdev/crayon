import { ForwardedRef, useCallback } from "react";
import { assignRef } from "../utils/ref";

/*
 * Custom hook to merge multiple refs into a single ref callback.
 *
 * @param refs - Any number of refs or ref functions to merge.
 * @returns A callback ref that assigns the value to all provided refs.
 */
export const useMultipleRefs = <RefType = any>(...refs: Array<ForwardedRef<RefType>>) => {
  return useCallback((value: RefType) => {
    refs.forEach((ref) => {
      assignRef(ref, value);
    });
    return value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
