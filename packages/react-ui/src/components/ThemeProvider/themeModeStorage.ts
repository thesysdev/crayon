// Shared with PrePaintScript, which reads the same storage before first paint.

/** localStorage key the preference is saved under (absent means "system"). */
export const THEME_MODE_STORAGE_KEY = "openui-theme-mode";

/**
 * Attribute set on <html> while a mode is pinned. The default token sheet
 * (openui-defaults) reads it, so an app can set it before paint from the saved
 * preference (see `PrePaintScript`) and render its first frame
 * in the chosen mode.
 */
export const THEME_MODE_ATTRIBUTE = "data-openui-theme";
