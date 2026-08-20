"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./CloudBanner.module.css";

export function CloudBanner() {
  const [shouldShow, setShouldShow] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  // Appear as soon as the hero is scrolled past, and stay for the rest of the page.
  useEffect(() => {
    const update = () => {
      setShouldShow(window.scrollY > window.innerHeight * 0.6);
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
    const timers: number[] = [];
    const schedule = (callback: () => void, delay: number) => {
      timers.push(window.setTimeout(callback, delay));
    };

    if (shouldShow) {
      schedule(() => setMounted(true), 0);
      schedule(() => setOpen(true), 20);
    } else {
      schedule(() => setOpen(false), 0);
      schedule(() => setMounted(false), 550);
    }

    return () => timers.forEach(window.clearTimeout);
  }, [shouldShow]);

  if (!mounted) return null;

  return (
    <Link
      href="/benchmarks"
      className={`${styles.banner} ${open ? styles.open : ""}`.trim()}
      aria-label="OpenUI Benchmark: Generative UI Benchmark. View the results."
    >
      <span className={styles.content}>
        <span className={styles.text}>
          <span className={styles.lead}>
            OpenUI <span className={styles.tag}>Benchmark</span>
            <span className={styles.colon}> :</span>
          </span>{" "}
          <span className={styles.rest}>Generative UI Benchmark</span>
        </span>
        <ArrowRight className={styles.chevron} size={18} strokeWidth={2.25} aria-hidden="true" />
      </span>
    </Link>
  );
}
