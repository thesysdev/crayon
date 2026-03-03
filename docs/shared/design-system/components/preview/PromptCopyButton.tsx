"use client";

import { IconButton } from "@openuidev/react-ui";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

interface PromptCopyButtonProps {
  text: string;
}

const FEEDBACK_DURATION_MS = 1600;

export default function PromptCopyButton({ text }: PromptCopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const canCopy = text.trim().length > 0;

  useEffect(() => {
    if (!copied) return;

    const timeoutId = window.setTimeout(() => {
      setCopied(false);
    }, FEEDBACK_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  const handleCopy = async () => {
    if (!canCopy) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <IconButton
      icon={copied ? <Check size={14} /> : <Copy size={14} />}
      variant="tertiary"
      size="extra-small"
      aria-label={copied ? "Prompt copied" : "Copy prompt"}
      onClick={handleCopy}
      disabled={!canCopy}
    />
  );
}
