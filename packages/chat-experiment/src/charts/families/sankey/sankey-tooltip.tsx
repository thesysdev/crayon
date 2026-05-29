"use client";

import type { SankeyLink, SankeyNode } from "d3-sankey";
import { intFmt } from "../../core/chart-formatters";
import { TooltipBox } from "../../primitives/tooltip/tooltip-box";
import { TooltipContent, type TooltipRow } from "../../primitives/tooltip/tooltip-content";
import { type SankeyLinkDatum, type SankeyNodeDatum, useSankey } from "./sankey-context";

// Helper to get node name from link source/target
type NodeOrIndex = SankeyNode<SankeyNodeDatum, SankeyLinkDatum> | number;

function getNodeName(nodeOrIndex: NodeOrIndex, fallbackIndex: number): string {
  if (typeof nodeOrIndex === "number") {
    return `Node ${nodeOrIndex}`;
  }
  return nodeOrIndex.name ?? `Node ${fallbackIndex}`;
}

export interface SankeyTooltipProps {
  /** Custom content renderer for node tooltips */
  nodeContent?: (props: {
    node: SankeyNode<SankeyNodeDatum, SankeyLinkDatum>;
    index: number;
  }) => React.ReactNode;
  /** Custom content renderer for link tooltips */
  linkContent?: (props: {
    link: SankeyLink<SankeyNodeDatum, SankeyLinkDatum>;
    index: number;
  }) => React.ReactNode;
  /** Value formatter function */
  formatValue?: (value: number) => string;
  /** Custom class name */
  className?: string;
}

export function SankeyTooltip({
  nodeContent,
  linkContent,
  formatValue = intFmt,
  className = "",
}: SankeyTooltipProps) {
  const { tooltipData, containerRef, width, height, margin, nodes, links, mousePos } = useSankey();

  if (!tooltipData) {
    return null;
  }

  // Use mouse position if available, otherwise fallback to anchor point
  const x = mousePos ? mousePos.x : tooltipData.x + margin.left;
  const y = mousePos ? mousePos.y : tooltipData.y + margin.top;

  // Render node tooltip
  if (tooltipData.type === "node" && tooltipData.nodeIndex !== undefined) {
    const node = nodes[tooltipData.nodeIndex];
    if (!node) {
      return null;
    }

    // Calculate total value flowing through this node
    const totalValue = node.value ?? 0;

    // Custom content
    if (nodeContent) {
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
          {nodeContent({ node, index: tooltipData.nodeIndex })}
        </TooltipBox>
      );
    }

    // Default node tooltip
    const rows: TooltipRow[] = [
      {
        color: "var(--chart-line-primary)",
        label: "Sessions",
        value: formatValue(totalValue),
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
        <TooltipContent rows={rows} title={node.name} />
      </TooltipBox>
    );
  }

  // Render link tooltip
  if (tooltipData.type === "link" && tooltipData.linkIndex !== undefined) {
    const link = links[tooltipData.linkIndex];
    if (!link) {
      return null;
    }

    // Get source and target names
    const sourceName = getNodeName(link.source as NodeOrIndex, tooltipData.linkIndex);
    const targetName = getNodeName(link.target as NodeOrIndex, tooltipData.linkIndex);

    // Custom content
    if (linkContent) {
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
          {linkContent({ link, index: tooltipData.linkIndex })}
        </TooltipBox>
      );
    }

    // Default link tooltip
    const rows: TooltipRow[] = [
      {
        color: "var(--chart-foreground-muted)",
        label: "Flow",
        value: formatValue(link.value),
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
        <TooltipContent rows={rows} title={`${sourceName} → ${targetName}`} />
      </TooltipBox>
    );
  }

  return null;
}

SankeyTooltip.displayName = "SankeyTooltip";

export default SankeyTooltip;
