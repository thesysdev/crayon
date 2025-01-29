import { useEffect, useState } from "react";

export const useElementSize = ({ ref }: { ref: React.RefObject<HTMLElement | null> }) => {
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
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
