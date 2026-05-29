"use client";

import type { SankeyNode as SankeyNodeType } from "d3-sankey";
import { motion } from "motion/react";
import { useCallback, useMemo } from "react";
import { intFmt } from "../../core/chart-formatters";
import { transitionWithDelay } from "../../core/motion-utils";
import { type SankeyLinkDatum, type SankeyNodeDatum, useSankey } from "./sankey-context";

// Helper to get node index from link source/target
type NodeOrIndex = SankeyNodeType<SankeyNodeDatum, SankeyLinkDatum> | number;

function getNodeIndex(nodeOrIndex: NodeOrIndex): number | undefined {
  if (typeof nodeOrIndex === "number") {
    return nodeOrIndex;
  }
  return nodeOrIndex.index;
}

export interface SankeyNodeProps {
  /** Fill color for nodes. Default: uses theme colors */
  fill?: string;
  /** Corner radius for nodes. Default: 4 */
  lineCap?: number;
  /** Opacity when another node/link is hovered. Default: 0.4 */
  fadedOpacity?: number;
  /** Show node labels. Default: true */
  showLabels?: boolean;
  /** Custom node color function */
  getNodeColor?: (node: SankeyNodeType<SankeyNodeDatum, SankeyLinkDatum>, index: number) => string;
}

interface AnimatedNodeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  rx: number;
  index: number;
  totalNodes: number;
  isFaded: boolean;
  fadedOpacity: number;
  animationDuration: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  name: string;
  value: number;
  isLeftSide: boolean;
  showLabels: boolean;
}

function AnimatedNode({
  x,
  y,
  width,
  height,
  fill,
  rx,
  index,
  totalNodes,
  isFaded,
  fadedOpacity,
  animationDuration,
  onMouseEnter,
  onMouseLeave,
  name,
  value,
  isLeftSide,
  showLabels,
}: AnimatedNodeProps) {
  const { enterTransition, revealEpoch } = useSankey();

  const nodeAnimDuration = animationDuration * 0.6;
  const staggerDelaySec = ((index / totalNodes) * nodeAnimDuration * 0.4) / 1000;
  const nameLabelDelaySec = staggerDelaySec + (nodeAnimDuration * 0.6 * 0.3) / 1000;
  const valueLabelDelaySec = nameLabelDelaySec + 0.06;

  const nodeEnter = transitionWithDelay(enterTransition, staggerDelaySec);
  const nameEnter = transitionWithDelay(enterTransition, nameLabelDelaySec);
  const valueEnter = transitionWithDelay(enterTransition, valueLabelDelaySec);
  const nameLabelX = isLeftSide ? x - 12 : x + width + 12;
  const valueLabelX = isLeftSide ? x - 12 : x + width + 12;
  const nodeOpacity = isFaded ? fadedOpacity : 1;
  const nameOpacity = isFaded ? fadedOpacity : 1;
  const valueOpacity = isFaded ? fadedOpacity * 0.8 : 0.6;

  return (
    <motion.g onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: "pointer" }}>
      <motion.rect
        animate={{ opacity: nodeOpacity, scaleY: 1 }}
        fill={fill}
        height={height}
        initial={{ opacity: 0, scaleY: 0 }}
        key={`node-${index}-${revealEpoch}`}
        rx={rx}
        ry={rx}
        style={{ originY: 0.5 }}
        transition={nodeEnter}
        width={width}
        x={x}
        y={y}
      />
      {showLabels && (
        <>
          <motion.text
            animate={{ opacity: nameOpacity, x: nameLabelX }}
            className="ce-sankey-node-label"
            dy="0.35em"
            initial={{ opacity: 0, x: isLeftSide ? x + 8 : x + width - 8 }}
            key={`name-${index}-${revealEpoch}`}
            textAnchor={isLeftSide ? "end" : "start"}
            transition={nameEnter}
            y={y + height / 2}
          >
            {name}
          </motion.text>
          <motion.text
            animate={{ opacity: valueOpacity, x: valueLabelX }}
            className="ce-sankey-node-value"
            dy="0.35em"
            initial={{ opacity: 0, x: isLeftSide ? x + 8 : x + width - 8 }}
            key={`value-${index}-${revealEpoch}`}
            textAnchor={isLeftSide ? "end" : "start"}
            transition={valueEnter}
            y={y + height / 2 + 16}
          >
            {intFmt(value)} sessions
          </motion.text>
        </>
      )}
    </motion.g>
  );
}

export function SankeyNode({
  fill,
  lineCap = 4,
  fadedOpacity = 0.4,
  showLabels = true,
  getNodeColor: getNodeColorProp,
}: SankeyNodeProps) {
  const {
    nodes,
    links,
    width,
    margin,
    hoveredNodeIndex,
    hoveredLinkIndex,
    setHoveredNodeIndex,
    setTooltipData,
    animationDuration,
  } = useSankey();

  // Default colors using CSS variables
  const defaultColors = useMemo(
    () => [
      "var(--chart-1)",
      "var(--chart-2)",
      "var(--chart-3)",
      "var(--chart-4)",
      "var(--chart-5)",
    ],
    [],
  );

  // Get color for a node
  const getColor = useCallback(
    (node: SankeyNodeType<SankeyNodeDatum, SankeyLinkDatum>, index: number): string => {
      if (fill) {
        return fill;
      }
      if (getNodeColorProp) {
        return getNodeColorProp(node, index);
      }

      return defaultColors[index % defaultColors.length] ?? "var(--chart-1)";
    },
    [fill, getNodeColorProp, defaultColors],
  );

  // Check if a node is connected to the hovered element
  const isNodeConnected = useCallback(
    (nodeIndex: number) => {
      if (hoveredNodeIndex !== null) {
        if (hoveredNodeIndex === nodeIndex) {
          return true;
        }
        return links.some((link) => {
          const sIdx = getNodeIndex(link.source as NodeOrIndex);
          const tIdx = getNodeIndex(link.target as NodeOrIndex);
          return (
            (sIdx === hoveredNodeIndex && tIdx === nodeIndex) ||
            (tIdx === hoveredNodeIndex && sIdx === nodeIndex)
          );
        });
      }
      if (hoveredLinkIndex !== null) {
        const link = links[hoveredLinkIndex];
        if (!link) {
          return false;
        }
        const sIdx = getNodeIndex(link.source as NodeOrIndex);
        const tIdx = getNodeIndex(link.target as NodeOrIndex);
        return sIdx === nodeIndex || tIdx === nodeIndex;
      }
      return false;
    },
    [hoveredNodeIndex, hoveredLinkIndex, links],
  );

  const isAnyHovered = hoveredNodeIndex !== null || hoveredLinkIndex !== null;
  const innerWidth = width - margin.left - margin.right;

  return (
    <g className="sankey-nodes">
      {nodes.map((node, index) => {
        const nodeX = node.x0 ?? 0;
        const nodeY = node.y0 ?? 0;
        const nodeWidth = (node.x1 ?? 0) - nodeX;
        const nodeHeight = (node.y1 ?? 0) - nodeY;

        const isConnected = isNodeConnected(index);
        const isFaded = isAnyHovered && !isConnected;
        const isLeftSide = nodeX < innerWidth / 2;

        let displayValue = 0;
        for (const l of links) {
          const sIdx = getNodeIndex(l.source as NodeOrIndex);
          const tIdx = getNodeIndex(l.target as NodeOrIndex);
          if (node.category === "source" && sIdx === index) {
            displayValue += l.value;
          } else if (node.category !== "source" && tIdx === index) {
            displayValue += l.value;
          }
        }

        const handleMouseEnter = () => {
          setHoveredNodeIndex(index);
          setTooltipData({
            type: "node",
            nodeIndex: index,
            x: 0,
            y: 0,
            data: node,
          });
        };

        const handleMouseLeave = () => {
          setHoveredNodeIndex(null);
          setTooltipData(null);
        };

        return (
          <AnimatedNode
            animationDuration={animationDuration}
            fadedOpacity={fadedOpacity}
            fill={getColor(node, index)}
            height={nodeHeight}
            index={index}
            isFaded={isFaded}
            isLeftSide={isLeftSide}
            key={`node-${node.name}`}
            name={node.name}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            rx={lineCap}
            showLabels={showLabels}
            totalNodes={nodes.length}
            value={displayValue}
            width={nodeWidth}
            x={nodeX}
            y={nodeY}
          />
        );
      })}
    </g>
  );
}

SankeyNode.displayName = "SankeyNode";

export default SankeyNode;
