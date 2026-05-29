"use client";

import { Group } from "@visx/group";
import type { Transition } from "motion/react";
import {
  Children,
  isValidElement,
  memo,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "../../../lib/utils";
import { ParentSize } from "../../core/responsive-parent-size";
import {
  defaultRingColors,
  type RingContextValue,
  type RingData,
  RingProvider,
} from "./ring-context";

export interface RingChartProps {
  /** Data array - each item represents a ring */
  data: RingData[];
  /** Chart size in pixels. If not provided, uses parent container size */
  size?: number;
  /** Stroke width of each ring. Default: 12 */
  strokeWidth?: number;
  /** Gap between rings. Default: 6 */
  ringGap?: number;
  /** Inner radius of the innermost ring. Default: 60 */
  baseInnerRadius?: number;
  /** Animation duration in milliseconds. Default: 1100 */
  animationDuration?: number;
  /** Additional class name for the container */
  className?: string;
  /** Controlled hover state - index of hovered ring */
  hoveredIndex?: number | null;
  /** Callback when hover state changes */
  onHoverChange?: (index: number | null) => void;
  /** Start angle in radians. Default: -PI/2 (top) */
  startAngle?: number;
  /** End angle in radians. Default: 3*PI/2 (full circle) */
  endAngle?: number;
  /** Framer Motion transition for ring enter animation */
  enterTransition?: Transition;
  /** Scales ring stagger delays (1 = default). */
  enterStaggerScale?: number;
  /** Child components (Ring, RingCenter, etc.) */
  children: ReactNode;
}

interface RingChartInnerProps {
  width: number;
  height: number;
  data: RingData[];
  strokeWidth: number;
  ringGap: number;
  baseInnerRadius: number;
  children: ReactNode;
  containerRef: React.RefObject<HTMLDivElement | null>;
  hoveredIndexProp?: number | null;
  onHoverChange?: (index: number | null) => void;
  startAngle: number;
  endAngle: number;
  enterTransition?: Transition;
  enterStaggerScale: number;
}

// Helper to check if a child is a RingCenter component
function isRingCenter(child: ReactNode): boolean {
  return (
    isValidElement(child) &&
    typeof child.type === "function" &&
    ((child.type as { displayName?: string }).displayName === "RingCenter" ||
      child.type.name === "RingCenter")
  );
}

function RingChartInner(props: RingChartInnerProps) {
  const size = Math.min(props.width, props.height);

  if (size < 10) {
    return null;
  }

  return <RingChartCore {...props} />;
}

const RingChartCore = memo(function RingChartCore({
  width,
  height,
  data,
  strokeWidth: strokeWidthProp,
  ringGap: ringGapProp,
  baseInnerRadius: baseInnerRadiusProp,
  children,
  containerRef,
  hoveredIndexProp,
  onHoverChange,
  startAngle,
  endAngle,
  enterTransition,
  enterStaggerScale,
}: RingChartInnerProps) {
  const [internalHoveredIndex, setInternalHoveredIndex] = useState<number | null>(null);
  const [animationKey] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Use controlled or uncontrolled hover state
  const isControlled = hoveredIndexProp !== undefined;
  const hoveredIndex = isControlled ? hoveredIndexProp : internalHoveredIndex;
  const setHoveredIndex = useCallback(
    (index: number | null) => {
      if (isControlled) {
        onHoverChange?.(index);
      } else {
        setInternalHoveredIndex(index);
      }
    },
    [isControlled, onHoverChange],
  );

  // Use the smaller dimension to ensure the chart fits
  const size = Math.min(width, height);
  const center = size / 2;

  // Calculate scaled dimensions to fit within the available space
  // The outermost ring needs to fit within the chart with some padding
  const ringCount = data.length;
  const padding = 8; // Padding from edge
  const availableRadius = center - padding;

  // Calculate the "design" outer radius (what we'd need at 1:1 scale)
  const designOuterRadius =
    baseInnerRadiusProp + (ringCount - 1) * (strokeWidthProp + ringGapProp) + strokeWidthProp;

  // Scale factor to fit within available space
  const scale = Math.min(1, availableRadius / designOuterRadius);

  // Apply scaling to all dimensions
  const strokeWidth = strokeWidthProp * scale;
  const ringGap = ringGapProp * scale;
  const baseInnerRadius = baseInnerRadiusProp * scale;

  // Calculate total value
  const totalValue = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  // Get color for a ring index
  const getColor = useCallback(
    (index: number) => {
      const item = data[index];
      if (item?.color) {
        return item.color;
      }
      return defaultRingColors[index % defaultRingColors.length] as string;
    },
    [data],
  );

  // Get ring radii for an index
  const getRingRadii = useCallback(
    (index: number) => {
      const innerRadius = baseInnerRadius + index * (strokeWidth + ringGap);
      const outerRadius = innerRadius + strokeWidth;
      return { innerRadius, outerRadius };
    },
    [baseInnerRadius, strokeWidth, ringGap],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: enterTransition
  useEffect(() => {
    setIsLoaded(false);
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [enterTransition, enterStaggerScale]);

  // Separate SVG children (rings) from HTML children (RingCenter)
  // This avoids Safari's foreignObject positioning bugs (WebKit #23113)
  const { svgChildren, centerChildren } = useMemo(() => {
    const svgNodes: ReactNode[] = [];
    const centerNodes: ReactNode[] = [];

    Children.forEach(children, (child) => {
      if (isRingCenter(child)) {
        centerNodes.push(child);
      } else {
        svgNodes.push(child);
      }
    });

    return { svgChildren: svgNodes, centerChildren: centerNodes };
  }, [children]);

  const contextValue: RingContextValue = {
    data,
    size,
    center,
    strokeWidth,
    ringGap,
    baseInnerRadius,
    hoveredIndex,
    setHoveredIndex,
    animationKey,
    isLoaded,
    enterTransition,
    enterStaggerScale,
    containerRef,
    totalValue,
    getColor,
    getRingRadii,
    startAngle,
    endAngle,
  };

  // Use CSS Grid stacking to layer SVG and HTML content
  // This avoids Safari's foreignObject rendering bugs where HTML content
  // inside SVG foreignObject renders at wrong positions when it has a RenderLayer
  return (
    <RingProvider value={contextValue}>
      <div
        className="ce-ring-chart__grid"
        style={{
          gridTemplateColumns: "1fr",
          gridTemplateRows: "1fr",
          width: size,
          height: size,
        }}
      >
        {/* SVG layer with rings */}
        <svg aria-hidden="true" height={size} style={{ gridArea: "1 / 1" }} width={size}>
          <Group left={center} top={center}>
            {svgChildren}
          </Group>
        </svg>

        {/* HTML layer with center content - stacked on top via grid */}
        {centerChildren.length > 0 && (
          <div className="ce-ring-chart__center" style={{ gridArea: "1 / 1" }}>
            {centerChildren}
          </div>
        )}
      </div>
    </RingProvider>
  );
});

export function RingChart({
  data,
  size: fixedSize,
  strokeWidth = 12,
  ringGap = 6,
  baseInnerRadius = 60,
  className = "",
  hoveredIndex,
  onHoverChange,
  startAngle = -Math.PI / 2,
  endAngle = (3 * Math.PI) / 2,
  enterTransition,
  enterStaggerScale = 1,
  children,
}: RingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // If fixed size is provided, use it directly
  if (fixedSize) {
    return (
      <div
        className={cn("ce-ring-chart ce-ring-chart--fixed", className)}
        ref={containerRef}
        style={{ width: fixedSize, height: fixedSize }}
      >
        <RingChartInner
          baseInnerRadius={baseInnerRadius}
          containerRef={containerRef}
          data={data}
          endAngle={endAngle}
          enterStaggerScale={enterStaggerScale}
          enterTransition={enterTransition}
          height={fixedSize}
          hoveredIndexProp={hoveredIndex}
          onHoverChange={onHoverChange}
          ringGap={ringGap}
          startAngle={startAngle}
          strokeWidth={strokeWidth}
          width={fixedSize}
        >
          {children}
        </RingChartInner>
      </div>
    );
  }

  // Otherwise use ParentSize for responsive sizing
  return (
    <div className={cn("ce-ring-chart ce-ring-chart--responsive", className)} ref={containerRef}>
      <ParentSize debounceTime={10}>
        {({ width, height }) => (
          <RingChartInner
            baseInnerRadius={baseInnerRadius}
            containerRef={containerRef}
            data={data}
            endAngle={endAngle}
            enterStaggerScale={enterStaggerScale}
            enterTransition={enterTransition}
            height={height}
            hoveredIndexProp={hoveredIndex}
            onHoverChange={onHoverChange}
            ringGap={ringGap}
            startAngle={startAngle}
            strokeWidth={strokeWidth}
            width={width}
          >
            {children}
          </RingChartInner>
        )}
      </ParentSize>
    </div>
  );
}

export default RingChart;
