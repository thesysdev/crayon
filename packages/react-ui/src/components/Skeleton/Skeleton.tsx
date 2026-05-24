import clsx from "clsx";

interface SkeletonBarProps {
  height: string;
  width: string;
  borderRadius?: string;
}

function SkeletonBar({ height, width, borderRadius }: SkeletonBarProps) {
  return (
    <div
      className="openui-skeleton-bar"
      style={{
        height,
        width,
        ...(borderRadius ? { borderRadius } : {}),
      }}
    />
  );
}

export function Skeleton({
  count = 1,
  height = "16px",
  width = "100%",
  borderRadius,
  className,
}: {
  count?: number;
  height?: string;
  width?: string;
  borderRadius?: string;
  className?: string;
}) {
  return (
    <div className={clsx("openui-skeleton-stack", className)}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonBar key={i} height={height} width={width} borderRadius={borderRadius} />
      ))}
    </div>
  );
}

export function PieChartSkeleton({
  size = 200,
  legendItems = 4,
  variant = "pie",
  appearance = "circular",
}: {
  size?: number;
  legendItems?: number;
  variant?: "pie" | "donut";
  appearance?: "circular" | "semiCircular";
}) {
  const isSemi = appearance === "semiCircular";
  const isDonut = variant === "donut";

  const chartClass = clsx(
    "openui-skeleton-pie-chart-shape",
    isSemi && isDonut
      ? "openui-skeleton-pie-chart-semi-donut"
      : isSemi
        ? "openui-skeleton-pie-chart-semi"
        : isDonut
          ? "openui-skeleton-pie-chart-donut"
          : undefined,
  );

  const chartHeight = isSemi ? size / 2 : size;

  return (
    <div className="openui-skeleton-pie-chart-wrapper">
      <div className="openui-skeleton-pie-chart-container">
        <div className={chartClass} style={{ width: size, height: chartHeight }} />
      </div>
      <div className="openui-skeleton-pie-chart-legend">
        {Array.from({ length: legendItems }, (_, i) => (
          <div key={i} className="openui-skeleton-pie-chart-legend-item">
            <div className="openui-skeleton-pie-chart-legend-dot" />
            <SkeletonBar height="12px" width={`${50 + ((i * 15) % 40)}%`} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="openui-skeleton-table">
      <div
        className="openui-skeleton-table-row"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }, (_, i) => (
          <div
            key={`h-${i}`}
            className={clsx("openui-skeleton-table-cell", "openui-skeleton-table-cell-short")}
          >
            <SkeletonBar height="14px" width="100%" />
          </div>
        ))}
      </div>
      {Array.from({ length: rows }, (_, ri) => (
        <div
          key={`r-${ri}`}
          className="openui-skeleton-table-row"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }, (_, ci) => (
            <div key={`c-${ri}-${ci}`} className="openui-skeleton-table-cell">
              <SkeletonBar height="14px" width={`${50 + ((ri * 7 + ci * 13) % 40)}%`} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
