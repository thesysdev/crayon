import { type FadeEdges, fadeGradientStops, resolveFadeSides } from "../../utils/fadeEdges";

interface AreaGradientDefsProps {
  gradientId: string;
  strokeGradientId: string;
  edgeMaskId: string;
  edgeGradientId: string;
  fill: string;
  fillOpacity: number;
  gradientToOpacity: number;
  resolvedStroke: string;
  isPatternFill: boolean;
  fadeEdges: FadeEdges;
  innerWidth: number;
  innerHeight: number;
}

export function AreaGradientDefs({
  gradientId,
  strokeGradientId,
  edgeMaskId,
  edgeGradientId,
  fill,
  fillOpacity,
  gradientToOpacity,
  resolvedStroke,
  isPatternFill,
  fadeEdges,
  innerWidth,
  innerHeight,
}: AreaGradientDefsProps) {
  const sides = resolveFadeSides(fadeEdges);
  // Stroke gradient mirrors the area's edge fade so the line doesn't pop in
  // past the faded fill. Skip emitting it when neither edge fades — the line
  // can then paint a solid stroke instead of an unnecessary url(#...) ref.
  const strokeStops = sides.any ? fadeGradientStops(sides) : null;
  const showEdgeMask = sides.any && !isPatternFill;
  const edgeStops = showEdgeMask ? fadeGradientStops(sides) : null;

  return (
    <defs>
      {isPatternFill ? null : (
        <linearGradient id={gradientId} x1="0%" x2="0%" y1="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: fill, stopOpacity: fillOpacity }} />
          <stop offset="100%" style={{ stopColor: fill, stopOpacity: gradientToOpacity }} />
        </linearGradient>
      )}

      {strokeStops ? (
        <linearGradient id={strokeGradientId} x1="0%" x2="100%" y1="0%" y2="0%">
          {strokeStops.map((stop) => (
            <stop
              key={stop.offset}
              offset={stop.offset}
              style={{ stopColor: resolvedStroke, stopOpacity: stop.opacity }}
            />
          ))}
        </linearGradient>
      ) : null}

      {edgeStops ? (
        <>
          <linearGradient id={edgeGradientId} x1="0%" x2="100%" y1="0%" y2="0%">
            {edgeStops.map((stop) => (
              <stop
                key={stop.offset}
                offset={stop.offset}
                style={{ stopColor: "white", stopOpacity: stop.opacity }}
              />
            ))}
          </linearGradient>
          <mask id={edgeMaskId}>
            <rect
              fill={`url(#${edgeGradientId})`}
              height={innerHeight}
              width={innerWidth}
              x="0"
              y="0"
            />
          </mask>
        </>
      ) : null}
    </defs>
  );
}
