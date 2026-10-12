export function formatCurrency(value: number): string {
  const sign = value < 0 ? "−" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 10_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs).toLocaleString("en-US")}`;
  const cents = Number.isInteger(abs) ? 0 : 2;
  return `${sign}$${abs.toLocaleString("en-US", { maximumFractionDigits: cents, minimumFractionDigits: cents })}`;
}

export function formatNumber(value: number): string {
  const sign = value < 0 ? "−" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 10_000) return `${sign}${(abs / 1_000).toFixed(1)}K`;
  return `${sign}${Math.round(abs).toLocaleString("en-US")}`;
}

/** A ratio (0.123) as "12.3%". */
export function formatPercent(ratio: number, digits = 1): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}

/** A percent change (12.4) as "+12.4%". */
export function formatChange(change: number, digits = 1): string {
  return `${change >= 0 ? "+" : "−"}${Math.abs(change).toFixed(digits)}%`;
}

/** A change in percentage points (1.2) as "+1.2 pts". */
export function formatPoints(points: number, digits = 1): string {
  return `${points >= 0 ? "+" : "−"}${Math.abs(points).toFixed(digits)} pts`;
}

/** Minutes as "6m 12s", or hours and days when longer. */
export function formatDuration(minutes: number): string {
  if (minutes >= 60 * 24) return `${(minutes / 60 / 24).toFixed(1)} days`;
  if (minutes >= 60) return `${(minutes / 60).toFixed(1)} h`;
  const whole = Math.floor(minutes);
  return `${whole}m ${String(Math.round((minutes - whole) * 60)).padStart(2, "0")}s`;
}

export type Tone = "good" | "bad" | "neutral";

/** Whether a change is good news, given which direction is good for the metric. */
export function changeTone(
  change: number | undefined,
  goodDirection: "up" | "down" | "neutral" = "up",
): Tone {
  if (change == null || Math.abs(change) < 0.05 || goodDirection === "neutral") return "neutral";
  return change > 0 === (goodDirection === "up") ? "good" : "bad";
}
