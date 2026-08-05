"use client";

import { CloudFeatureMarquee } from "@/app/(home)/cloud/CloudFeatureMarquee";
import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "../chat-page.module.css";

// Sidebar footer: "Demo powered by OpenUI Cloud" label plus a "Why upgrade?"
// button that opens a bottom sheet with the Cloud page's 12-reasons marquee.
export function SidebarUpgradeFooter() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <div className={styles.sidebarUpgradeFooter}>
        <div className={styles.sidebarBuiltWith}>
          Demo powered by OpenUI
          <span className={styles.sidebarCloudChip}>Cloud</span>
        </div>
        <button type="button" className={styles.sidebarUpgradeButton} onClick={() => setOpen(true)}>
          Why upgrade?
        </button>
      </div>
      {open && (
        <div
          className={styles.upgradeSheetOverlay}
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className={styles.upgradeSheet}
            role="dialog"
            aria-modal="true"
            aria-label="12 reasons to switch to Cloud"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.upgradeSheetHeader}>
              <h2 className={styles.upgradeSheetTitle}>12 reasons to switch to Cloud</h2>
              <div className={styles.upgradeSheetActions}>
                <Link
                  href="/docs/agent/getting-started/openui-cloud"
                  prefetch={false}
                  className={`${styles.upgradeSheetCta} ${styles.upgradeSheetCtaDesktop}`}
                >
                  Build for free
                  <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  className={styles.upgradeSheetClose}
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  <X size={15} strokeWidth={2} aria-hidden="true" />
                </button>
              </div>
            </div>
            <CloudFeatureMarquee />
            <Link
              href="/docs/agent/getting-started/openui-cloud"
              prefetch={false}
              className={`${styles.upgradeSheetCta} ${styles.upgradeSheetCtaMobile}`}
            >
              Build for free
              <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
