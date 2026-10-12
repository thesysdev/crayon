// Shared with PrePaintScript, which reads the same storage before first paint.

/**
 * Storage key for the persisted desktop sidebar choice. Kept separate from
 * `isSidebarOpen` so opening the drawer on mobile isn't remembered on desktop.
 */
export const SIDEBAR_OPEN_STORAGE_KEY = "openui-agent-sidebar-open";
export const SIDEBAR_WIDTH_STORAGE_KEY = "openui-agent-sidebar-width";
export const SIDEBAR_WIDTH_VAR = "--openui-agent-sidebar-width";
export const SIDEBAR_MIN_WIDTH = 220;
export const SIDEBAR_MAX_WIDTH = 420;
