import clsx from "clsx";
import { scaleLinear, scaleSqrt } from "d3-scale";
import { useCallback, useMemo, useState } from "react";
import { useContainerSize } from "../../../components/Charts/hooks";
import { ChartLegend, ChartTooltip } from "../../../components/Charts/shared";
import { FadeFollower } from "../../../components/Charts/shared/spring";
import { KIT_CHART_PREFIX } from "../../../components/Charts/utils/constants";
import { formatNumber, formatPoints } from "../../../core/format";
import {
  median,
  packBubbles,
  placeLabels,
  quadrantOf,
  QUADRANTS,
  type Bubble,
} from "./matrixGeometry";
import { MatrixAxes } from "./parts/MatrixAxes";
import { MatrixBubbles } from "./parts/MatrixBubbles";
import type { EngagementMatrixProps, Quadrant } from "./types";

const P = `${KIT_CHART_PREFIX}-engagement-matrix`;
const PAD = { left: 44, right: 20, top: 16, bottom: 40 };
const MIN_WIDTH = 320;
const MIN_RADIUS = 5;
const RADIUS_RANGE = 11;

/**
 * Amplitude's engagement matrix: each feature a bubble placed by breadth
 * (share of monthly users) and frequency (days a week), sized by users, split
 * at the medians into Core, Power, Broad but infrequent, and Review or retire.
 * react-ui's ScatterChart has no quadrants or point labels, so this is a kit
 * chart on the same architecture: d3 linear scales place the bubbles, a d3
 * sqrt scale sizes them by area, and a spring data morph glides them when a
 * filter changes the data.
 */
export function EngagementMatrix(props: EngagementMatrixProps) {
  if (props.features.length === 0) {
    return (
      <div className={clsx(`${P} ${P}--empty`, props.className)}>
        <span className={`${P}-empty-text`}>No data available</span>
      </div>
    );
  }
  return <EngagementMatrixImpl {...props} />;
}

function EngagementMatrixImpl({
  features,
  height = 340,
  isAnimationActive = true,
  className,
}: EngagementMatrixProps) {
  const [frameRef, size] = useContainerSize<HTMLDivElement>(640, height);
  const [hover, setHover] = useState<number | null>(null);
  const [resting, setResting] = useState(0);
  const onHover = useCallback((i: number) => {
    setHover(i);
    setResting(i);
  }, []);
  const width = Math.max(size.width, MIN_WIDTH);
  const right = width - PAD.right;
  const bottom = height - PAD.bottom;

  const layout = useMemo(() => {
    const maxFrequency = Math.ceil(Math.max(...features.map((f) => f.frequency)) + 0.5);
    const medianBreadth = median(features.map((f) => f.breadth));
    const medianFrequency = median(features.map((f) => f.frequency));
    const x = scaleLinear().domain([0, 100]).range([PAD.left, right]);
    const y = scaleLinear().domain([0, maxFrequency]).range([bottom, PAD.top]);
    const r = scaleSqrt()
      .domain([0, Math.max(...features.map((f) => f.users), 1)])
      .range([MIN_RADIUS, MIN_RADIUS + RADIUS_RANGE]);
    const quadrants: Quadrant[] = features.map((f) =>
      quadrantOf(f, medianBreadth, medianFrequency),
    );
    const bubbles: Bubble[] = features.map((f) => ({
      cx: x(f.breadth),
      cy: y(f.frequency),
      r: r(f.users),
      label: f.name,
    }));
    const labels = placeLabels(bubbles, { left: PAD.left, right: width - 2 });
    return {
      x,
      y,
      maxFrequency,
      medianBreadth,
      medianFrequency,
      quadrants,
      bubbles,
      names: features.map((f) => f.name),
      colors: quadrants.map((q) => QUADRANTS[q].color),
      anchors: labels.map((l) => l?.anchor),
      flat: packBubbles(bubbles, labels),
    };
  }, [features, width, right, bottom]);

  const { x, y, quadrants, bubbles } = layout;
  const hovered = hover != null ? features[hover] : undefined;
  const hoveredQuadrant = hover != null ? QUADRANTS[quadrants[hover]!] : undefined;
  const ring = bubbles[Math.min(resting, bubbles.length - 1)]!;

  return (
    <div className={clsx(P, className)}>
      <ChartLegend
        items={(Object.keys(QUADRANTS) as Quadrant[]).map((q) => ({
          name: QUADRANTS[q].label,
          color: QUADRANTS[q].color,
          kind: "rect" as const,
        }))}
      />
      <div
        ref={frameRef}
        className={`${P}-frame`}
        style={{ height }}
        onPointerLeave={() => setHover(null)}
      >
        <svg
          width={width}
          height={height}
          className={`${P}-svg`}
          role="img"
          aria-label="Engagement matrix"
        >
          <MatrixAxes
            x={x}
            y={y}
            maxFrequency={layout.maxFrequency}
            medianBreadth={layout.medianBreadth}
            medianFrequency={layout.medianFrequency}
            left={PAD.left}
            right={right}
            top={PAD.top}
            bottom={bottom}
            height={height}
          />
          <MatrixBubbles
            flat={layout.flat}
            names={layout.names}
            colors={layout.colors}
            anchors={layout.anchors}
            hover={hover}
            onHover={onHover}
            layoutKey={`${width}x${height}`}
            isAnimationActive={isAnimationActive}
          />
          <FadeFollower x={ring.cx} y={ring.cy} visible={hover != null}>
            <circle r={ring.r + 4} className={`${P}-ring`} />
          </FadeFollower>
        </svg>
        {hovered && hoveredQuadrant && (
          <ChartTooltip
            x={x(hovered.breadth)}
            y={Math.max(0, y(hovered.frequency) - 40)}
            width={width}
            title={hovered.name}
            rows={[
              {
                color: hoveredQuadrant.color,
                name: "of monthly users",
                value: `${hovered.breadth}%`,
                kind: "rect",
              },
              {
                color: hoveredQuadrant.color,
                name: "days per week",
                value: `${hovered.frequency}`,
                kind: "rect",
              },
              {
                color: hoveredQuadrant.color,
                name: "users",
                value: formatNumber(hovered.users),
                kind: "rect",
              },
            ]}
            footer={
              <>
                <span>{hoveredQuadrant.label}</span>
                <strong className={hovered.change >= 0 ? "kit-text-good" : "kit-text-bad"}>
                  {formatPoints(hovered.change)}
                </strong>
              </>
            }
          />
        )}
      </div>
    </div>
  );
}
