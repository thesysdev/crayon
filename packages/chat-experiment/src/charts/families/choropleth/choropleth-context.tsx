"use client";

import type { ProvidedZoom, TransformMatrix } from "@visx/zoom";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Transition } from "motion/react";
import {
  createContext,
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useContext,
} from "react";

// ZoomState from visx/zoom that includes isDragging
interface ZoomState {
  initialTransformMatrix: TransformMatrix;
  transformMatrix: TransformMatrix;
  isDragging: boolean;
}

// Combined type from visx Zoom children prop
export type ZoomInstance<E extends Element> = ProvidedZoom<E> & ZoomState;

// Zoom context to share zoom controls with child components
interface ChoroplethZoomContextValue {
  zoom: ZoomInstance<SVGSVGElement> | null;
}

export const ChoroplethZoomContext = createContext<ChoroplethZoomContextValue>({
  zoom: null,
});

export function useChoroplethZoom() {
  return useContext(ChoroplethZoomContext);
}

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ChoroplethFeatureProperties {
  name?: string;
  id?: string | number;
  [key: string]: unknown;
}

export type ChoroplethFeature = Feature<Geometry, ChoroplethFeatureProperties>;

export interface ChoroplethTooltipData {
  featureIndex: number;
  x: number;
  y: number;
  feature: ChoroplethFeature;
}

export interface ChoroplethContextValue {
  // Geo data
  features: ChoroplethFeature[];
  featureCollection: FeatureCollection<Geometry, ChoroplethFeatureProperties>;

  // Projection function (returns path string)
  pathGenerator: (feature: ChoroplethFeature) => string | undefined;

  // Raw path function for graticule (accepts any geo object)
  // biome-ignore lint/suspicious/noExplicitAny: GeoJSON types are complex
  rawPathGenerator: (geo: any) => string | null;

  // Project geo coordinates to screen coordinates
  projectPoint: (coords: [number, number]) => [number, number] | null;

  // Dimensions
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
  margin: Margin;

  // Hover state
  hoveredFeatureIndex: number | null;
  setHoveredFeatureIndex: (index: number | null) => void;

  // Tooltip
  tooltipData: ChoroplethTooltipData | null;
  setTooltipData: Dispatch<SetStateAction<ChoroplethTooltipData | null>>;
  containerRef: RefObject<HTMLDivElement | null>;

  // Animation
  isLoaded: boolean;
  animationDuration: number;
  enterTransition?: Transition;
  revealEpoch: number;
}

const ChoroplethContext = createContext<ChoroplethContextValue | null>(null);

export function ChoroplethProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: ChoroplethContextValue;
}) {
  return <ChoroplethContext.Provider value={value}>{children}</ChoroplethContext.Provider>;
}

export function useChoropleth(): ChoroplethContextValue {
  const context = useContext(ChoroplethContext);
  if (!context) {
    throw new Error("useChoropleth must be used within a ChoroplethProvider");
  }
  return context;
}

// CSS variables for choropleth theming
export const choroplethCssVars = {
  feature1: "var(--chart-1)",
  feature2: "var(--chart-2)",
  feature3: "var(--chart-3)",
  feature4: "var(--chart-4)",
  feature5: "var(--chart-5)",
  stroke: "var(--chart-grid)",
  background: "var(--background)",
};

// Default colors array for cycling through features
export const defaultChoroplethColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
