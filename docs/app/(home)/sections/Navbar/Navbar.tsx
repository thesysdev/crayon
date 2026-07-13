"use client";

import { copyText } from "@/app/(home)/components/Button/Button";
import { SiteMarketingHeader } from "@/components/site-marketing-header";
import { Check, SquareTerminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./Navbar.module.css";

const CREATE_COMMAND = "npx @openuidev/cli@latest create";
const COPY_FEEDBACK_MS = 1800;

function StartLocallyButton() {
  const [copied, setCopied] = useState(false);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  const handleCopy = async () => {
    if (!(await copyText(CREATE_COMMAND))) return;

    setCopied(true);
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  };

  return (
    <button
      type="button"
      className={styles.startLocallyButton}
      onClick={handleCopy}
      aria-label={copied ? "Create command copied" : "Copy the command to start OpenUI locally"}
      title={`Copy: ${CREATE_COMMAND}`}
    >
      {copied ? (
        <Check size={17} strokeWidth={2} aria-hidden="true" />
      ) : (
        <SquareTerminal size={17} strokeWidth={1.8} aria-hidden="true" />
      )}
      <span aria-live="polite">{copied ? "Copied" : "Start locally"}</span>
    </button>
  );
}

export function Navbar() {
  return <SiteMarketingHeader borderMode="scroll" extraActions={<StartLocallyButton />} />;
}
