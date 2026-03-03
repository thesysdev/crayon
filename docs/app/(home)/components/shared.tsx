import svgPaths from "@/imports/svg-urruvoh2be";

// ---------------------------------------------------------------------------
// Design tokens shared across multiple sections
// ---------------------------------------------------------------------------

export const BUTTON_SHADOW = "0px 8px 16px 0px rgba(22,34,51,0.08)";

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------

/** Clipboard/copy icon used in CTA buttons across Hero, BuildChat, etc. */
export function CopyIcon({ color = "white" }: { color?: string }) {
  return (
    <svg className="shrink-0 size-4" fill="none" viewBox="0 0 14.6667 14.6667">
      <path
        d={svgPaths.p102ea840}
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.33333"
      />
    </svg>
  );
}
