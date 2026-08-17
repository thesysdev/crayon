declare const __OPENUI_LANG_CORE_VERSION__: string;

/** Package version baked in at build time. */
export const VERSION =
  typeof __OPENUI_LANG_CORE_VERSION__ === "string"
    ? __OPENUI_LANG_CORE_VERSION__
    : "0.0.0-development";
