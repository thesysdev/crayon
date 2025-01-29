import { RefObject, useEffect } from "react";

export const useScrollToBottom = <T extends HTMLElement | null>(
  ref: RefObject<T>,
  // scroll to bottom when this value changes
  triggerScroll: any,
) => {
  useEffect(() => {
    const element = ref.current;
    if (!element || !triggerScroll) {
      return;
    }

    element.scrollTo({
      top: element.scrollHeight,
      behavior: "smooth",
    });
  }, [ref, triggerScroll]);
};
