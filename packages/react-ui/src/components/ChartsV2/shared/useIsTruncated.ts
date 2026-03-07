import React from "react";

export function useIsTruncated(ref: React.RefObject<HTMLElement | null>): boolean {
  const [truncated, setTruncated] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => {
      setTruncated(el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight);
    };

    check();

    const observer = new ResizeObserver(check);
    observer.observe(el);

    return () => observer.disconnect();
  }, [ref]);

  return truncated;
}
