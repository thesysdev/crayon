/** True for `"1"` or `"true"` (any case). */
export const isTruthyEnv = (value?: string) =>
  value === "1" || value?.toLowerCase() === "true";
