"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import "./C1DocsDialog.css";

const SOURCE_PARAM = "from";
const SOURCE_VALUE = "c1";
const SEEN_KEY = "openui:c1-docs-dialog-seen";
const LEGACY_DOCS_URL = "https://docs.thesys.dev/legacy";

function subscribe() {
  return () => {};
}

function shouldPrompt() {
  if (new URLSearchParams(window.location.search).get(SOURCE_PARAM) !== SOURCE_VALUE) return false;

  try {
    return window.localStorage.getItem(SEEN_KEY) !== "true";
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
    return true;
  }
}

/**
 * Shown once to visitors redirected here from docs.thesys.dev, which keeps the C1 docs
 * at /legacy. The redirect tags those visits with `?from=c1`.
 */
export function C1DocsDialog() {
  const prompt = useSyncExternalStore(subscribe, shouldPrompt, () => false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!prompt) return;

    try {
      window.localStorage.setItem(SEEN_KEY, "true");
    } catch {
      // Showing it this once is enough when persistence is unavailable.
    }
  }, [prompt]);

  return (
    <Dialog.Root
      open={prompt && !dismissed}
      onOpenChange={(open) => {
        if (!open) setDismissed(true);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="c1-docs-dialog-overlay" />
        <Dialog.Content className="c1-docs-dialog">
          <Dialog.Close asChild>
            <button className="c1-docs-dialog-close" aria-label="Close dialog">
              <X size={16} />
            </button>
          </Dialog.Close>

          <Dialog.Title asChild>
            <h2>Looking for the Thesys C1 docs?</h2>
          </Dialog.Title>
          <Dialog.Description asChild>
            <p>
              OpenUI is the successor to C1 and these are its docs. C1 is still supported, and its
              documentation is archived at docs.thesys.dev/legacy — the{" "}
              <Link href="/docs/agent/guides/migrating" onClick={() => setDismissed(true)}>
                migration guide
              </Link>{" "}
              covers what changes when you move over.
            </p>
          </Dialog.Description>

          <div className="c1-docs-dialog-actions">
            <Dialog.Close asChild>
              <button className="c1-docs-dialog-secondary">Stay on the OpenUI docs</button>
            </Dialog.Close>
            <a className="c1-docs-dialog-primary" href={LEGACY_DOCS_URL}>
              Go to the C1 docs
            </a>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
