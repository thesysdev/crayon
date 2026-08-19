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

  return (
    <Link
      href="/benchmarks"
      className={`${styles.banner} ${open ? styles.open : ""}`.trim()}
      aria-label="We benchmarked OpenUI against A2UI and json-render. See the results."
    >
      <span className={styles.content}>
        <span className={styles.text}>
          <span className={styles.lead}>
            <span className={styles.tag}>Benchmarks</span>
            <span className={styles.colon}> :</span>
          </span>{" "}
          <span className={styles.rest}>OpenUI vs A2UI vs json-render</span>
        </span>
        <ArrowRight className={styles.chevron} size={18} strokeWidth={2.25} aria-hidden="true" />
      </span>
    </Link>
  );
}
