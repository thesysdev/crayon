"use client";

import { geoCentroid } from "d3-geo";
import { motion } from "motion/react";
import { useCallback, useMemo } from "react";
import { transitionWithDelay } from "../../core/motion-utils";
import {
  type ChoroplethFeature as ChoroplethFeatureType,
  defaultChoroplethColors,
  useChoropleth,
} from "./choropleth-context";

export interface ChoroplethFeatureProps {
  /** Fill color for all features (overrides getFeatureColor). Default: uses getFeatureColor or chart-1 */
  fill?: string;
  /** Stroke color for feature borders. Default: var(--chart-grid) */
  stroke?: string;
  /** Stroke width for feature borders. Default: 0.5 */
  strokeWidth?: number;
  /** Opacity when another feature is hovered. Default: 0.4 */
  fadedOpacity?: number;
  /** Custom function to get feature fill color */
  getFeatureColor?: (feature: ChoroplethFeatureType, index: number) => string;
  /** Pattern definitions to render in defs. Use @visx/pattern components (PatternLines, PatternCircles, etc.) */
  patterns?: React.ReactNode;
  /** Return pattern ID for a feature, or null/undefined to use solid fill */
  getFeaturePattern?: (feature: ChoroplethFeatureType, index: number) => string | null | undefined;
}

interface AnimatedFeaturePathProps {
  path: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  isFaded: boolean;
  isHighlighted: boolean;
  fadedOpacity: number;
  animationDuration: number;
  index: number;
  totalFeatures: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function AnimatedFeaturePath({
  path,
  fill,
  stroke,
  strokeWidth,
  isFaded,
  isHighlighted,
  fadedOpacity,
  animationDuration,
  index,
  totalFeatures,
  onMouseEnter,
  onMouseLeave,
}: AnimatedFeaturePathProps) {
  const { enterTransition, revealEpoch } = useChoropleth();
  const staggerDelaySec = ((index / totalFeatures) * animationDuration * 0.5) / 1000;
  const enterAnim = transitionWithDelay(enterTransition, staggerDelaySec);

  // Calculate target opacity - slightly boost highlighted features
  const getTargetOpacity = () => {
    if (isFaded) {
      return fadedOpacity;
    }
    if (isHighlighted) {
      return 1;
    }
    return 0.85;
  };
  const targetOpacity = getTargetOpacity();

  return (
    <motion.path
      animate={{ opacity: targetOpacity }}
      className="ce-choropleth-feature"
      d={path}
      fill={fill}
      initial={{ opacity: 0 }}
      key={`feature-${index}-${revealEpoch}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      stroke={stroke}
      strokeWidth={strokeWidth}
      transition={{
        opacity: { duration: 0.18, ease: "easeOut" },
        default: enterAnim,
      }}
    />
  );
}

export function ChoroplethFeature({
  fill,
  stroke = "var(--background)",
  strokeWidth = 0.5,
  fadedOpacity = 0.4,
  getFeatureColor,
  patterns,
  getFeaturePattern,
}: ChoroplethFeatureProps) {
  const {
    features,
    pathGenerator,
    projectPoint,
    hoveredFeatureIndex,
    setHoveredFeatureIndex,
    setTooltipData,
    animationDuration,
    width,
    height,
  } = useChoropleth();

  // Pre-calculate centroids for all features (only recalculates when features change)
  const featureCentroids = useMemo(() => {
    return features.map((feature) => {
      try {
        const centroid = geoCentroid(feature);
        if (centroid && !Number.isNaN(centroid[0]) && !Number.isNaN(centroid[1])) {
          const projected = projectPoint(centroid as [number, number]);
          if (projected) {
            // Clamp to chart bounds with padding
            const padding = 60;
            const x = Math.max(padding, Math.min(width - padding, projected[0]));
            const y = Math.max(padding, Math.min(height - padding, projected[1]));
            return { x, y };
          }
        }
      } catch {
        // Some geometries may not have valid centroids
      }
      return null;
    });
  }, [features, projectPoint, width, height]);

  // Get color for a feature
  const getFeatureColorFn = useCallback(
    (feature: ChoroplethFeatureType, index: number): string => {
      if (fill) {
        return fill;
      }
      if (getFeatureColor) {
        return getFeatureColor(feature, index);
      }
      // Default: use chart colors cycling through
      return defaultChoroplethColors[index % defaultChoroplethColors.length] ?? "var(--chart-1)";
    },
    [fill, getFeatureColor],
  );

  // Check if any element is hovered
  const isAnyHovered = hoveredFeatureIndex !== null;

  return (
    <g className="choropleth-features">
      {/* Pattern definitions */}
      {patterns && <defs>{patterns}</defs>}

      {/* Feature paths */}
      {features.map((feature, index) => {
        const path = pathGenerator(feature);

        // Skip if path is empty or undefined
        if (!path || path.trim() === "") {
          return null;
        }

        const isHighlighted = hoveredFeatureIndex === index;
        const isFaded = isAnyHovered && !isHighlighted;

        // Get pre-calculated centroid for tooltip positioning
        const centroid = featureCentroids[index];

        const handleMouseEnter = () => {
          setHoveredFeatureIndex(index);
          setTooltipData({
            featureIndex: index,
            x: centroid?.x ?? width / 2,
            y: centroid?.y ?? height / 2,
            feature,
          });
        };

        const handleMouseLeave = () => {
          setHoveredFeatureIndex(null);
          setTooltipData(null);
        };

        // Determine fill (pattern URL or solid color)
        let featureFill: string;
        const patternId = getFeaturePattern?.(feature, index);
        if (patternId) {
          featureFill = `url(#${patternId})`;
        } else {
          featureFill = getFeatureColorFn(feature, index);
        }

        return (
          <AnimatedFeaturePath
            animationDuration={animationDuration}
            fadedOpacity={fadedOpacity}
            fill={featureFill}
            index={index}
            isFaded={isFaded}
            isHighlighted={isHighlighted}
            key={`feature-${feature.properties?.name ?? feature.properties?.id ?? feature.id ?? path}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            path={path}
            stroke={stroke}
            strokeWidth={strokeWidth}
            totalFeatures={features.length}
          />
        );
      })}
    </g>
  );
}

ChoroplethFeature.displayName = "ChoroplethFeature";

export default ChoroplethFeature;
