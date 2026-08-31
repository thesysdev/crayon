"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import styles from "./c1-docs-banner.module.css";

const SOURCE_PARAM = "from";
const SOURCE_VALUE = "c1";
const SESSION_KEY = "openui:from-c1-docs";
const DISMISSED_KEY = "openui:c1-docs-banner-dismissed";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readStorage(storage: Storage, key: string) {
  try {
    return storage.getItem(key) === "true";
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
    return false;
  }
}

function isC1Redirect() {
  return new URLSearchParams(window.location.search).get(SOURCE_PARAM) === SOURCE_VALUE;
}

function shouldShowBanner() {
  if (readStorage(window.localStorage, DISMISSED_KEY)) return false;

  return isC1Redirect() || readStorage(window.sessionStorage, SESSION_KEY);
}

/**
 * Shown to visitors redirected here from docs.thesys.dev, which keeps the C1 docs at
 * /legacy. Sticks for the rest of the session so it survives in-site navigation, and
 * stays dismissed for good.
 *
 * Offsets the fixed docs navbar and layout padding through `--c1-banner-height`.
 */
export function C1DocsBanner() {
  const visible = useSyncExternalStore(subscribe, shouldShowBanner, () => false);

  useEffect(() => {
    if (!isC1Redirect()) return;

    try {
      window.sessionStorage.setItem(SESSION_KEY, "true");
    } catch {
      // Keep the banner on this page even if persistence is unavailable.
    }
  }, []);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      // Hiding it for this render is enough when persistence is unavailable.
    }

    listeners.forEach((listener) => listener());
  }, []);

  if (!visible) return null;

  return (
    <>
      <style>{":root { --c1-banner-height: 2.5rem; }"}</style>
      <div className={styles.banner} role="region" aria-label="Thesys C1 documentation notice">
        <span>
          Thesys C1 is still supported — its docs are archived at{" "}
          <Link href="https://docs.thesys.dev/legacy" target="_blank" rel="noopener noreferrer">
            docs.thesys.dev/legacy
          </Link>
          .
        </span>
        <Link href="/docs/agent/guides/migrating" className={styles.migrationLink}>
          Migrating to OpenUI?
        </Link>
        <button type="button" onClick={dismiss} aria-label="Dismiss" className={styles.dismiss}>
          <X size={14} />
        </button>
      </div>
    </>
  );
}
