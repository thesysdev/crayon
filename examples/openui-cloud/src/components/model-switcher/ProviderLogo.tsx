"use client";

import { useTheme } from "@/hooks/use-system-theme";

export function ProviderLogo({
  provider,
  size = "md",
}: {
  provider: string;
  size?: "sm" | "md";
}) {
  const mode = useTheme();
  const box = size === "sm" ? "h-5 w-5 rounded-md" : "h-7 w-7 rounded-lg";
  const img = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center bg-[var(--openui-border-default)] ${box}`}
    >
      <img src={`/logos/${provider.toLowerCase()}-${mode}.svg`} alt="" className={img} />
    </span>
  );
}
