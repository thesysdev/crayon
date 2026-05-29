"use client";

import { Mercator } from "@visx/geo";
import type { TransformMatrix } from "@visx/zoom";
import { Zoom } from "@visx/zoom";
import type { FeatureCollection, Geometry } from "geojson";
import type { Transition } from "motion/react";
import React, { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../../lib/utils";
import { ParentSize } from "../../core/responsive-parent-size";
import {
  type ChoroplethFeatureProperties,
  ChoroplethProvider,
  type ChoroplethTooltipData,
  ChoroplethZoomContext,
  type Margin,
  type ZoomInstance,
} from "./choropleth-context";

export interface ChoroplethChartProps {
  /** GeoJSON FeatureCollection data */
  data: FeatureCollection<Geometry, ChoroplethFeatureProperties>;
  /** Chart margins */
  margin?: Partial<Margin>;
  /** Animation duration in milliseconds. Default: 800 */
  animationDuration?: number;
  /** Motion enter transition (spring or cubic-bezier tween). */
  enterTransition?: Transition;
  /** Signature of motion URL state — triggers enter replay when it changes. */
  revealSignature?: string;
  /** Aspect ratio as "width / height". Default: "16 / 9" */
  aspectRatio?: string;
  /** Projection scale. If not provided, auto-calculated based on width */
  scale?: number;
  /** Center coordinates [longitude, latitude]. Default: [0, 20] */
  center?: [number, number];
  /** Translate offset [x, y]. If not provided, auto-calculated to center */
  translate?: [number, number];
  /** Enable zoom and pan. Default: false */
  zoomEnabled?: boolean;
  /** Minimum zoom scale. Default: 0.5 */
  zoomMin?: number;
  /** Maximum zoom scale. Default: 4 */
  zoomMax?: number;
  /** Initial zoom transform */
  initialZoom?: TransformMatrix;
  /** Additional class name for the container */
  className?: string;
  /** Child components (ChoroplethFeature, ChoroplethGraticule, ChoroplethTooltip) */
  children: ReactNode;
}

const DEFAULT_MARGIN: Margin = { top: 0, right: 0, bottom: 0, left: 0 };

// Known SVG component displayNames
const SVG_COMPONENT_NAMES = new Set([
  "ChoroplethFeature",
  "ChoroplethGraticule",
  "ChoroplethTooltip",
]);

// HTML elements that should render in overlay layer
const HTML_ELEMENTS = new Set(["div", "span", "button", "p", "a"]);

// Separate children into SVG and overlay layers
function separateChildren(children: ReactNode): {
  svgChildren: React.ReactNode[];
  overlayChildren: React.ReactNode[];
} {
  const childArray = React.Children.toArray(children);
  const svgChildren: React.ReactNode[] = [];
  const overlayChildren: React.ReactNode[] = [];

  for (const child of childArray) {
    if (!React.isValidElement(child)) {
      svgChildren.push(child);
      continue;
    }

    // Check if it's a known SVG component by displayName
    const displayName =
      typeof child.type === "function"
        ? (child.type as { displayName?: string }).displayName
        : null;

    if (displayName && SVG_COMPONENT_NAMES.has(displayName)) {
      svgChildren.push(child);
    } else if (typeof child.type === "string") {
      // Native elements - HTML goes to overlay, SVG stays in SVG
      if (HTML_ELEMENTS.has(child.type)) {
        overlayChildren.push(child);
      } else {
        svgChildren.push(child);
      }
    } else {
      // Unknown React components (like ZoomControls) go to overlay
      overlayChildren.push(child);
    }
  }

  return { svgChildren, overlayChildren };
}

const DEFAULT_INITIAL_ZOOM: TransformMatrix = {
  scaleX: 1,
  scaleY: 1,
  translateX: 0,
  translateY: 0,
  skewX: 0,
  skewY: 0,
};

function ChoroplethChartInner({
  data,
  width,
  height,
  margin,
  animationDuration,
  enterTransition,
  revealSignature = "",
  scale: scaleProp,
  center,
  translate: translateProp,
  zoomEnabled,
  zoomMin,
  zoomMax,
  initialZoom,
  children,
}: {
  data: FeatureCollection<Geometry, ChoroplethFeatureProperties>;
  width: number;
  height: number;
  margin: Margin;
  animationDuration: number;
  enterTransition?: Transition;
  revealSignature?: string;
  scale?: number;
  center: [number, number];
  translate?: [number, number];
  zoomEnabled: boolean;
  zoomMin: number;
  zoomMax: number;
  initialZoom: TransformMatrix;
  children: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [revealEpoch, setRevealEpoch] = useState(0);
  const [hoveredFeatureIndex, setHoveredFeatureIndex] = useState<number | null>(null);
  const [tooltipData, setTooltipData] = useState<ChoroplethTooltipData | null>(null);

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Auto-calculate scale based on width if not provided
  const scale = scaleProp ?? (innerWidth / 630) * 100;

  // Auto-calculate translate to center if not provided
  const translate = translateProp ?? [
    innerWidth / 2 + margin.left,
    innerHeight / 2 + margin.top + 50,
  ];

  // biome-ignore lint/correctness/useExhaustiveDependencies: revealSignature
  useEffect(() => {
    setRevealEpoch((n) => n + 1);
    setIsLoaded(false);
    const timeout = setTimeout(() => {
      setIsLoaded(true);
    }, animationDuration);
    return () => clearTimeout(timeout);
  }, [animationDuration, revealSignature]);

  const handleMouseLeave = useCallback(() => {
    setHoveredFeatureIndex(null);
    setTooltipData(null);
  }, []);

  if (width < 10 || height < 10) {
    return null;
  }

  return (
    <Mercator
      center={center}
      data={data.features}
      scale={scale}
      translate={translate as [number, number]}
    >
      {(mercator) => {
        // Project geo coordinates to screen coordinates using the projection
        const projectPoint = (coords: [number, number]): [number, number] | null => {
          const projected = mercator.projection(coords);
          if (!projected) {
            return null;
          }
          return projected as [number, number];
        };

        const contextValue = {
          features: data.features,
          featureCollection: data,
          pathGenerator: (feature: (typeof data.features)[0]) =>
            mercator.path(feature) ?? undefined,
          // biome-ignore lint/suspicious/noExplicitAny: GeoJSON types are complex
          rawPathGenerator: (geo: any) => mercator.path(geo),
          projectPoint,
          width,
          height,
          innerWidth,
          innerHeight,
          margin,
          hoveredFeatureIndex,
          setHoveredFeatureIndex,
          tooltipData,
          setTooltipData,
          containerRef,
          isLoaded,
          animationDuration,
          enterTransition,
          revealEpoch,
        };

        // Separate SVG children from HTML overlay children
        const { svgChildren, overlayChildren } = separateChildren(children);

        const svgContent = (zoom?: ZoomInstance<SVGSVGElement>) => (
          <ChoroplethZoomContext.Provider value={{ zoom: zoom ?? null }}>
            <ChoroplethProvider value={contextValue}>
              <div className="ce-choropleth-container" ref={containerRef}>
                <svg
                  aria-hidden="true"
                  height={height}
                  onMouseLeave={handleMouseLeave}
                  ref={zoom?.containerRef}
                  style={{
                    cursor: zoom?.isDragging ? "grabbing" : "grab",
                    touchAction: "none",
                  }}
                  width={width}
                >
                  <g
                    style={{
                      transition: zoom?.isDragging ? "none" : "transform 0.18s ease-out",
                    }}
                    transform={zoom ? zoom.toString() : undefined}
                  >
                    {svgChildren}
                  </g>
                </svg>
                {/* HTML overlay layer for controls, legends, etc. */}
                {overlayChildren}
              </div>
            </ChoroplethProvider>
          </ChoroplethZoomContext.Provider>
        );

        if (zoomEnabled) {
          return (
            <Zoom<SVGSVGElement>
              height={height}
              initialTransformMatrix={initialZoom}
              scaleXMax={zoomMax}
              scaleXMin={zoomMin}
              scaleYMax={zoomMax}
              scaleYMin={zoomMin}
              wheelDelta={(event) => {
                // Reduce zoom sensitivity (default is too aggressive)
                const scale = event.deltaY > 0 ? 0.95 : 1.05;
                return { scaleX: scale, scaleY: scale };
              }}
              width={width}
            >
              {(zoom) => svgContent(zoom)}
            </Zoom>
          );
        }

        return svgContent();
      }}
    </Mercator>
  );
}

export function ChoroplethChart({
  data,
  margin: marginProp,
  animationDuration = 800,
  enterTransition,
  revealSignature,
  aspectRatio = "16 / 9",
  scale,
  center = [0, 20],
  translate,
  zoomEnabled = false,
  zoomMin = 0.5,
  zoomMax = 4,
  initialZoom = DEFAULT_INITIAL_ZOOM,
  className = "",
  children,
}: ChoroplethChartProps) {
  const margin = { ...DEFAULT_MARGIN, ...marginProp };

  return (
    <div className={cn("ce-choropleth-root", className)} style={{ aspectRatio }}>
      <ParentSize>
        {({ width, height }) =>
          width > 0 && height > 0 ? (
            <ChoroplethChartInner
              animationDuration={animationDuration}
              center={center}
              data={data}
              enterTransition={enterTransition}
              height={height}
              initialZoom={initialZoom}
              margin={margin}
              revealSignature={revealSignature}
              scale={scale}
              translate={translate}
              width={width}
              zoomEnabled={zoomEnabled}
              zoomMax={zoomMax}
              zoomMin={zoomMin}
            >
              {children}
            </ChoroplethChartInner>
          ) : null
        }
      </ParentSize>
    </div>
  );
}

ChoroplethChart.displayName = "ChoroplethChart";

export default ChoroplethChart;
