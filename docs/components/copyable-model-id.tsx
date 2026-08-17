"use client";

import { cn } from "@/lib/cn";
import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { useCopyButton } from "fumadocs-ui/utils/use-copy-button";
import { Check, Copy } from "lucide-react";

export function CopyableModelId({ value }: { value: string }) {
  const [copied, onCopy] = useCopyButton(() => navigator.clipboard.writeText(value));

  return (
    <span className="not-prose inline-flex items-center gap-1 rounded-md border bg-fd-secondary py-0.5 pl-2 pr-1 font-mono text-xs text-fd-secondary-foreground">
      <code>{value}</code>
      <button
        type="button"
        className={cn(buttonVariants({ color: "ghost", size: "icon-xs" }), "shrink-0")}
        aria-label={copied ? `Copied ${value}` : `Copy ${value}`}
        title={copied ? "Copied" : "Copy model identifier"}
        onClick={onCopy}
      >
        {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      </button>
    </span>
  );
}
