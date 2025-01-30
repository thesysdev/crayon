import { ForwardedRef } from "react";

/**
 * Assigns a value to a ref.
 * if we need to assign same value to multiple refs, we cannot do it directly. there are lot of checks since the type of
 * forwarded ref is ((instance: T | null) => void) | MutableRefObject<T | null> | null, this util helps with this.
 *
 * @param ref - The ref to assign the value to.
 * @param value - The value to assign.
 *
 */
export const assignRef = (ref: ForwardedRef<any>, value: any) => {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
};
