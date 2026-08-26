"use client";

import { useEffect, useRef, useState } from "react";

// Shared header-menu behavior: mouse hover with a grace delay, click toggle,
// outside pointer-down close, and Escape close with focus restoration.
export function useHeaderDropdown() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const cancelScheduledClose = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = null;
  };

  const handleHoverOpen = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    cancelScheduledClose();
    setOpen(true);
  };

  const handleHoverClose = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    cancelScheduledClose();
    closeTimeoutRef.current = setTimeout(() => setOpen(false), 160);
  };

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return { open, setOpen, wrapRef, triggerRef, handleHoverOpen, handleHoverClose };
}
