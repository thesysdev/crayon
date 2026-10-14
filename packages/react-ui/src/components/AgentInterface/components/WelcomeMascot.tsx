import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { MASCOT_BODY_PATHS, MASCOT_EYES, MASCOT_VIEWBOX } from "./mascotPaths";

// Width of the mascot's viewBox, used to map eye centres to screen pixels.
const VIEWBOX_WIDTH = 201;
// How far (in viewBox units) the eyes may drift from rest.
const MAX_OFFSET = 2;
// The eyes only follow the cursor within this distance (CSS px) of the mascot.
const NEAR_PX = 180;
// Fraction of the remaining distance covered per frame. Lower is lazier.
const EASE = 0.08;
// The white glint drifts this much further than the eye, for a hint of depth.
const GLINT_EXTRA = 0.35;

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The OpenUI mascot for the welcome screen: it blinks once when it appears,
 * its eyes gently follow the cursor while it is nearby, and it squishes when
 * clicked. Static under `prefers-reduced-motion`. Pass it as
 * `<AgentInterface.Welcome image={<WelcomeMascot />} />`.
 */
export const WelcomeMascot = ({
  className,
  label = "OpenUI",
}: {
  className?: string;
  /** Accessible name for the image. */
  label?: string;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const eyeRefs = useRef<(SVGGElement | null)[]>([]);
  const glintRefs = useRef<(SVGPathElement | null)[]>([]);
  const [blinking, setBlinking] = useState(false);
  const [squish, setSquish] = useState(0);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || prefersReducedMotion()) return;

    const target = MASCOT_EYES.map(() => ({ x: 0, y: 0 }));
    const current = MASCOT_EYES.map(() => ({ x: 0, y: 0 }));
    let frame = 0;

    const tick = () => {
      let moving = false;
      current.forEach((c, i) => {
        const t = target[i]!;
        c.x += (t.x - c.x) * EASE;
        c.y += (t.y - c.y) * EASE;
        if (Math.abs(t.x - c.x) > 0.01 || Math.abs(t.y - c.y) > 0.01) moving = true;
        eyeRefs.current[i]?.setAttribute(
          "transform",
          `translate(${c.x.toFixed(3)} ${c.y.toFixed(3)})`,
        );
        glintRefs.current[i]?.setAttribute(
          "transform",
          `translate(${(c.x * GLINT_EXTRA).toFixed(3)} ${(c.y * GLINT_EXTRA).toFixed(3)})`,
        );
      });
      frame = moving ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const rect = svg.getBoundingClientRect();
      const near =
        Math.hypot(
          e.clientX - (rect.left + rect.width / 2),
          e.clientY - (rect.top + rect.height / 2),
        ) < NEAR_PX;
      const scale = rect.width / VIEWBOX_WIDTH;
      MASCOT_EYES.forEach((eye, i) => {
        if (!near) {
          target[i] = { x: 0, y: 0 };
          return;
        }
        const dx = e.clientX - (rect.left + eye.cx * scale);
        const dy = e.clientY - (rect.top + eye.cy * scale);
        const dist = Math.hypot(dx, dy) || 1;
        const reach = Math.min(dist / NEAR_PX, 1) * MAX_OFFSET;
        target[i] = { x: (dx / dist) * reach, y: (dy / dist) * reach };
      });
      kick();
    };

    const onLeave = () => {
      target.forEach((t) => {
        t.x = 0;
        t.y = 0;
      });
      kick();
    };

    // A single hello blink shortly after the mascot first appears.
    const timers = [
      setTimeout(() => setBlinking(true), 600),
      setTimeout(() => setBlinking(false), 760),
    ];

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
    };
  }, []);

  const onPress = () => {
    if (prefersReducedMotion()) return;
    // Bumping the key restarts the squish animation on every click.
    setSquish((n) => n + 1);
  };

  return (
    <svg
      ref={svgRef}
      viewBox={MASCOT_VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={label}
      className={clsx("openui-agent-welcome-mascot", className)}
      onPointerDown={onPress}
    >
      <g key={squish} className={squish ? "openui-agent-welcome-mascot__body--squish" : undefined}>
        {MASCOT_BODY_PATHS.map((p, i) => (
          <path key={i} d={p.d} fill={p.fill} />
        ))}
        {MASCOT_EYES.map((eye, i) => (
          <g
            key={i}
            className="openui-agent-welcome-mascot__lid"
            style={{ transformOrigin: `${eye.cx}px ${eye.cy}px` }}
            data-blinking={blinking || undefined}
          >
            <g ref={(el) => void (eyeRefs.current[i] = el)}>
              <path d={eye.eye} fill="black" />
              <path ref={(el) => void (glintRefs.current[i] = el)} d={eye.glint} fill="white" />
            </g>
          </g>
        ))}
      </g>
    </svg>
  );
};
