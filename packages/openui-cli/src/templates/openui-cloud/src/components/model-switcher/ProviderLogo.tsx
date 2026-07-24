"use client";

import { useTheme } from "@/hooks/use-system-theme";

export function ProviderLogo({
  provider,
  variant,
  size = "md",
}: {
  provider: string;
  // Force a mark variant regardless of app theme (the white trigger always
  // needs the light-background mark).
  variant?: "light" | "dark";
  size?: "sm" | "md";
}) {
  const mode = useTheme();
  const resolved = variant ?? mode;
  const box = size === "sm" ? "h-5 w-5 rounded-md" : "h-7 w-7 rounded-lg";
  const img = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center bg-black/[0.06] dark:bg-white/10 ${box}`}
    >
      <img src={`/logos/${provider.toLowerCase()}-${resolved}.svg`} alt="" className={img} />
    </span>
  );
}
