export const VIEWPORT_PRESETS = [
  { id: "mobile", label: "Mobile" },
  { id: "desktop", label: "Desktop" },
] as const;

export type ViewportPreset = (typeof VIEWPORT_PRESETS)[number]["id"];

export function isViewportPreset(value: string): value is ViewportPreset {
  return VIEWPORT_PRESETS.some((preset) => preset.id === value);
}
