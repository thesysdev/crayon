import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

const DURATION_MS = 200;
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export function PasteModal({
  open,
  children,
  onClose,
}: {
  open: boolean;
  children: ReactNode;
  onClose: () => void;
}) {
  const reduceMotion = usePrefersReducedMotion();
  const { present, shown } = usePresence(open, DURATION_MS, reduceMotion);

  if (!present) return null;

  return (
    <div
      style={{
        ...styles.shell,
        pointerEvents: shown ? "auto" : "none",
      }}
      onClick={onClose}
      role="presentation"
    >
      <div
        style={{
          ...styles.backdrop,
          opacity: shown ? 1 : 0,
          transition: reduceMotion ? "none" : `opacity ${DURATION_MS}ms ease`,
        }}
      />
      <div
        style={{
          ...styles.dialog,
          opacity: shown ? 1 : 0,
          transform: shown ? "none" : "translateY(10px) scale(0.98)",
          transition: reduceMotion
            ? "none"
            : `opacity ${DURATION_MS}ms ${EASE}, transform ${DURATION_MS}ms ${EASE}`,
        }}
        role="dialog"
        aria-modal="true"
        aria-label="OpenUI Paste"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function usePresence(open: boolean, duration: number, instant: boolean) {
  const [present, setPresent] = useState(open);
  const [shown, setShown] = useState(false);

  if (open && !present) setPresent(true);

  useEffect(() => {
    if (open) {
      if (instant) {
        setShown(true);
        return;
      }
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }

    setShown(false);
    if (!present) return;
    if (instant) {
      setPresent(false);
      return;
    }
    const timeout = window.setTimeout(() => setPresent(false), duration);
    return () => window.clearTimeout(timeout);
  }, [open, duration, instant, present]);

  return { present, shown };
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return reduced;
}

const styles = {
  shell: {
    position: "fixed",
    inset: 0,
    zIndex: 2147483647,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  backdrop: {
    position: "absolute",
    inset: 0,
    background: "rgba(24, 24, 27, 0.4)",
  },
  dialog: {
    position: "relative",
    width: "min(1280px, calc(100vw - 32px))",
    height: "min(860px, calc(100vh - 32px))",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    border: "1px solid #e4e4e7",
    borderRadius: 16,
    background: "#ffffff",
    boxShadow: "0 16px 48px rgba(24, 24, 27, 0.18)",
  },
} satisfies Record<string, CSSProperties>;
