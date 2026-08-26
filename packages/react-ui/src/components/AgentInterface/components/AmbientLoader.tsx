import clsx from "clsx";
import { DotMatrixLoader } from "../../DotMatrixLoader";

/**
 * Ambient loading state for AgentInterface surfaces: two blurred glow blobs
 * drift and breathe behind a centered dot-matrix loader with a contextual
 * label. Fills whatever panel hosts it (min 280px tall), adapts to light/dark
 * through the theme tokens, and freezes under `prefers-reduced-motion`.
 *
 * The label is required on purpose — every loading surface should say what is
 * actually happening ("Loading artifacts…"), never a bare "Loading…".
 */
export const AmbientLoader = ({ label, className }: { label: string; className?: string }) => (
  <div className={clsx("openui-agent-ambient-loader", className)} role="status" aria-live="polite">
    <div className="openui-agent-ambient-loader__glow openui-agent-ambient-loader__glow--a" />
    <div className="openui-agent-ambient-loader__glow openui-agent-ambient-loader__glow--b" />
    {/* The matrix carries its own status role; hide it so the label below is
        the single announcement for this surface. */}
    <span aria-hidden="true">
      <DotMatrixLoader />
    </span>
    <span className="openui-agent-ambient-loader__label">{label}</span>
  </div>
);
