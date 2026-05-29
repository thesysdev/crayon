"use client";

import { intFmt } from "../chart-formatters";
import { TooltipBox } from "../tooltip/tooltip-box";
import { TooltipContent, type TooltipRow } from "../tooltip/tooltip-content";
import { type ChoroplethFeature, useChoropleth, useChoroplethZoom } from "./choropleth-context";

export interface ChoroplethTooltipProps {
  /** Custom content renderer for feature tooltips */
  content?: (props: { feature: ChoroplethFeature; index: number }) => React.ReactNode;
  /** Value formatter function */
  formatValue?: (value: number) => string;
  /** Get the display name for a feature. Default: uses feature.properties.name */
  getFeatureName?: (feature: ChoroplethFeature, index: number) => string;
  /** Get the value for a feature (for display in tooltip) */
  getFeatureValue?: (feature: ChoroplethFeature, index: number) => number | undefined;
  /** Label for the value row. Default: "Value" */
  valueLabel?: string;
  /** Custom class name */
  className?: string;
}

export function ChoroplethTooltip({
  content,
  formatValue = intFmt,
  getFeatureName,
  getFeatureValue,
  valueLabel = "Value",
  className = "",
}: ChoroplethTooltipProps) {
  const { tooltipData, containerRef, width, height, features } = useChoropleth();
  const { zoom } = useChoroplethZoom();

  if (!tooltipData) {
    return null;
  }

  // Apply zoom transform to centroid position
  let x = tooltipData.x;
  let y = tooltipData.y;

  if (zoom) {
    // Apply the zoom transform matrix to the tooltip position
    const transformed = zoom.applyToPoint({ x, y });
    x = transformed.x;
    y = transformed.y;
  }

  const feature = features[tooltipData.featureIndex];
  if (!feature) {
    return null;
  }

  // Get feature name
  const featureName = getFeatureName
    ? getFeatureName(feature, tooltipData.featureIndex)
    : (feature.properties?.name ?? `Feature ${tooltipData.featureIndex}`);

  // Custom content
  if (content) {
    return (
      <TooltipBox
        className={className}
        containerHeight={height}
        containerRef={containerRef}
        containerWidth={width}
        visible
        x={x}
        y={y}
      >
        {content({ feature, index: tooltipData.featureIndex })}
      </TooltipBox>
    );
  }

  // Default tooltip with optional value
  const value = getFeatureValue?.(feature, tooltipData.featureIndex);
  const rows: TooltipRow[] =
    value === undefined
      ? []
      : [
          {
            color: "var(--chart-1)",
            label: valueLabel,
            value: formatValue(value),
          },
        ];

  return (
    <TooltipBox
      className={className}
      containerHeight={height}
      containerRef={containerRef}
      containerWidth={width}
      visible
      x={x}
      y={y}
    >
      <TooltipContent rows={rows} title={featureName} />
    </TooltipBox>
  );
}

ChoroplethTooltip.displayName = "ChoroplethTooltip";

export default ChoroplethTooltip;
