export const VIEWPORT_PRESETS = [
  { id: "mobile", label: "Mobile" },
  { id: "tablet", label: "Tablet" },
  { id: "desktop", label: "Desktop" },
] as const;

export type ViewportPreset = (typeof VIEWPORT_PRESETS)[number]["id"];

export const FORM_FACTOR_QUERY_PARAM = "form_factor";
const FORM_FACTOR_CHANGE_EVENT = "openui:form-factor-change";

export function isViewportPreset(value: string): value is ViewportPreset {
  return VIEWPORT_PRESETS.some((preset) => preset.id === value);
}

export function getFormFactorFromUrl(url: URL): ViewportPreset | undefined {
  const value = url.searchParams.get(FORM_FACTOR_QUERY_PARAM);
  return value && isViewportPreset(value) ? value : undefined;
}

export function setCurrentUrlFormFactor(viewport: ViewportPreset): void {
  const url = new URL(window.location.href);
  if (getFormFactorFromUrl(url) === viewport) return;

  url.searchParams.set(FORM_FACTOR_QUERY_PARAM, viewport);
  window.history.replaceState(window.history.state, "", url);
  window.dispatchEvent(new Event(FORM_FACTOR_CHANGE_EVENT));
}

export function getCurrentUrlFormFactor(): ViewportPreset | undefined {
  return getFormFactorFromUrl(new URL(window.location.href));
}

export function getServerUrlFormFactor(): undefined {
  return undefined;
}

export function subscribeToCurrentUrlFormFactor(onStoreChange: () => void): () => void {
  window.addEventListener("popstate", onStoreChange);
  window.addEventListener(FORM_FACTOR_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("popstate", onStoreChange);
    window.removeEventListener(FORM_FACTOR_CHANGE_EVENT, onStoreChange);
  };
}

export function preserveCurrentUrlSearch(pathname: string): string {
  return `${pathname}${window.location.search}`;
}
