import { useState } from "react";
import { useIsomorphicLayoutEffect } from "../components/Charts/hooks/core/useIsomorphicLayoutEffect";

export const useElementSize = ({ ref }: { ref: React.RefObject<HTMLElement | null> }) => {
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Before paint, so layout-dependent UI (mobile vs desktop) is right on the
  // first visible frame.
  useIsomorphicLayoutEffect(() => {
    if (!ref.current) {
      return;
    }
    const element = ref.current;
    const handleResize = () => {
      setSize({ width: element.clientWidth, height: element.clientHeight });
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(element);

    handleResize();
    return () => {
      resizeObserver.disconnect();
    };
  }, [ref]);

  return size;
};
