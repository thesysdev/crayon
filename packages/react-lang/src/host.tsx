// Host elements for the web build. The React Native build resolves
// `./host` to host.native.tsx instead (see tsdown.config.ts), so Renderer and
// WithPreviewRenderer stay platform-agnostic. Keep the exports in sync.
import { useInsertionEffect, type ComponentPropsWithRef } from "react";

// ─── Loading style injection (once per document) ───

let loadingStyleInjected = false;
function ensureLoadingStyle() {
  if (loadingStyleInjected || typeof document === "undefined") return;
  loadingStyleInjected = true;
  const style = document.createElement("style");
  style.textContent = `@keyframes openui-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}

/** Default query loader: a small spinner pinned to the top-right corner. */
export function QuerySpinner() {
  useInsertionEffect(() => {
    ensureLoadingStyle();
  }, []);
  return (
    <div
      role="status"
      aria-label="Loading data"
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        width: 16,
        height: 16,
        border: "2px solid #e5e7eb",
        borderTopColor: "#3b82f6",
        borderRadius: "50%",
        animation: "openui-spin 0.6s linear infinite",
        zIndex: 10,
      }}
    />
  );
}

export type HostViewProps = ComponentPropsWithRef<"div"> & {
  /** Fades content while queries load. Omit to leave opacity untouched. */
  dimmed?: boolean;
};

export function HostView({ dimmed, style, ...props }: HostViewProps) {
  return (
    <div
      {...props}
      style={
        dimmed === undefined
          ? style
          : { opacity: dimmed ? 0.7 : 1, transition: "opacity 0.2s ease", ...style }
      }
    />
  );
}

export type HostButtonProps = ComponentPropsWithRef<"button">;

/** A button that runs `onActivate` unless disabled or the click handler calls preventDefault(). */
export function HostButton({
  onActivate,
  controls,
  onClick,
  disabled,
  "aria-controls": ariaControls,
  ...props
}: HostButtonProps & { onActivate: () => void; controls?: string }) {
  return (
    <button
      type="button"
      {...props}
      aria-controls={controls ?? ariaControls}
      disabled={disabled}
      onClick={(event) => {
        if (disabled || event.defaultPrevented) return;
        onClick?.(event);
        if (!event.defaultPrevented) onActivate();
      }}
    />
  );
}

export type HostRegionProps = ComponentPropsWithRef<"section">;

export function HostRegion({ style, ...props }: HostRegionProps) {
  return <section {...props} style={{ position: "relative", ...style }} />;
}
