"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { CLOUD_SECTION_ID } from "../CloudSection/CloudSection";
import styles from "./CloudBanner.module.css";

export function CloudBanner() {
  const [shouldShow, setShouldShow] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  // Show once past the first screen, but hide near the top and once the OpenUI
  // Cloud section has been reached (and stay hidden through and past it).
  useEffect(() => {
    const update = () => {
      const vh = window.innerHeight;
      const past = window.scrollY > vh * 0.6;
      const el = document.getElementById(CLOUD_SECTION_ID);
      const rect = el?.getBoundingClientRect();
      const reachedCloud = rect ? rect.top <= vh * 0.75 : false;
      setShouldShow(past && !reachedCloud);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Mount, then open just after paint. On hide, play the exit before unmounting.
  useEffect(() => {
    if (shouldShow) {
      setMounted(true);
      const id = setTimeout(() => setOpen(true), 20);
      return () => clearTimeout(id);
    }
    setOpen(false);
    const id = setTimeout(() => setMounted(false), 550);
    return () => clearTimeout(id);
  }, [shouldShow]);

  if (!mounted) return null;

  const scrollToCloud = () => {
    document.getElementById(CLOUD_SECTION_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <button
      type="button"
      onClick={scrollToCloud}
      className={`${styles.banner} ${open ? styles.open : ""}`.trim()}
      aria-label="Introducing OpenUI Cloud. Generative UI, ready for production. Jump to section."
    >
      <span className={styles.content}>
        <span className={styles.text}>
          <span className={styles.lead}>
            Introducing OpenUI <span className={styles.tag}>Cloud</span>
            <span className={styles.colon}> :</span>
          </span>{" "}
          <span className={styles.rest}>Production-ready Generative UI</span>
        </span>
        <ChevronDown className={styles.chevron} size={18} strokeWidth={2.25} aria-hidden="true" />
      </span>
    </button>
  );
}
