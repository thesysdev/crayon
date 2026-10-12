import { KIT_CHART_PREFIX } from "../../../../components/Charts/utils/constants";

const P = `${KIT_CHART_PREFIX}-engagement-matrix`;
const BREADTH_TICKS = [0, 25, 50, 75, 100];

/**
 * Gridlines and ticks for breadth (x, percent of monthly users) and frequency
 * (y, days per week), the median lines, the shaded Core quadrant, the
 * quadrant names in their corners, and the axis titles.
 */
export function MatrixAxes({
  x,
  y,
  maxFrequency,
  medianBreadth,
  medianFrequency,
  left,
  right,
  top,
  bottom,
  height,
}: {
  x: (breadth: number) => number;
  y: (frequency: number) => number;
  maxFrequency: number;
  medianBreadth: number;
  medianFrequency: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  height: number;
}) {
  const midY = (top + bottom) / 2;
  return (
    <g className={`${P}-axes`}>
      <rect
        x={x(medianBreadth)}
        y={top}
        width={right - x(medianBreadth)}
        height={y(medianFrequency) - top}
        className={`${P}-core`}
      />
      {BREADTH_TICKS.map((t) => (
        <text key={t} x={x(t)} y={bottom + 16} className={`${P}-tick`} textAnchor="middle">
          {t}%
        </text>
      ))}
      {Array.from({ length: maxFrequency + 1 }, (_, t) => (
        <g key={t}>
          <line
            x1={left}
            x2={right}
            y1={y(t)}
            y2={y(t)}
            className={t === 0 ? `${P}-baseline` : `${P}-grid`}
          />
          <text x={left - 8} y={y(t) + 4} className={`${P}-tick`} textAnchor="end">
            {t}d
          </text>
        </g>
      ))}
      <line
        x1={x(medianBreadth)}
        x2={x(medianBreadth)}
        y1={top}
        y2={bottom}
        className={`${P}-median`}
      />
      <line
        x1={left}
        x2={right}
        y1={y(medianFrequency)}
        y2={y(medianFrequency)}
        className={`${P}-median`}
      />
      <text x={right - 6} y={top + 14} textAnchor="end" className={`${P}-quadrant`}>
        Core
      </text>
      <text x={left + 8} y={top + 14} className={`${P}-quadrant`}>
        Power
      </text>
      <text x={right - 6} y={bottom - 8} textAnchor="end" className={`${P}-quadrant`}>
        Broad, infrequent
      </text>
      <text x={left + 8} y={bottom - 8} className={`${P}-quadrant`}>
        Review or retire
      </text>
      <text x={(left + right) / 2} y={height - 4} textAnchor="middle" className={`${P}-title`}>
        Breadth: % of monthly active users
      </text>
      <text
        x={12}
        y={midY}
        textAnchor="middle"
        className={`${P}-title`}
        transform={`rotate(-90 12 ${midY})`}
      >
        Frequency: days per week
      </text>
    </g>
  );
}
