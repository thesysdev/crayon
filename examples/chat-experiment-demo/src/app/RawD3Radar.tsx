"use client";

// Reference implementation: the Radar chart drawn with RAW d3 (d3-selection +
// d3-transition owning the SVG via a ref) instead of Visx/Motion rendering.
// Mirrors the Visx Radar card: 5 concentric grid pentagons (offset half a step
// from the axes) + level labels (20…100), one radial axis per metric, a metric
// label ring at radius+24, and two data polygons (Player A --chart-1, Player B
// --chart-3) filled at 0.15 opacity. Entrances grow grid/axes/labels/polygons
// out from the center, staggered. Hover scales the hovered polygon to 1.05 with
// a glow + thicker stroke + denser fill + bigger points, and dims the other.

import * as d3 from "d3";
import { useEffect, useRef } from "react";

import { radarData, radarMetrics } from "./sample-data";

const SIZE = 300;
const LEVELS = 5;
const MARGIN = 60;
const RADIUS = (SIZE - MARGIN * 2) / 2; // 90
const CENTER = SIZE / 2; // 150
const LABEL_OFFSET = 24;
const STEP = (2 * Math.PI) / radarMetrics.length; // 2π / 5
const ANGLE_OFFSET = -Math.PI / 2; // first metric at top

function resolveColor(cs: CSSStyleDeclaration, raw: string, fallback: string) {
  const m = /var\((--[\w-]+)\)/.exec(raw);
  if (m) return cs.getPropertyValue(m[1]).trim() || fallback;
  return raw || fallback;
}

const PALETTE_FALLBACK = ["#5b8def", "#22c55e", "#f59e0b", "#ef4444", "#a855f7"];

// Metric axis angle — standard (cos, sin) convention, first metric at the top.
const axisAngle = (i: number) => i * STEP + ANGLE_OFFSET;
const pointPos = (i: number, value: number) => {
  const a = axisAngle(i);
  const r = (value / 100) * RADIUS;
  return { x: r * Math.cos(a), y: r * Math.sin(a) };
};

// Grid pentagon vertex. Mirrors Visx LineRadial: angle 0 at top, clockwise, with
// the bklit half-step (+36°) offset so grid corners sit between the axes.
const gridVertex = (deg: number, r: number) => {
  const a = ((360 - deg) / 360) * 2 * Math.PI;
  return [r * Math.sin(a), -r * Math.cos(a)] as const;
};

const polyPath = (pts: { x: number; y: number }[]) =>
  "M" + pts.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join("L") + "Z";

type AreaDatum = {
  index: number;
  label: string;
  color: string;
  targets: { x: number; y: number }[];
};

export function RawD3Radar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const hasAnimatedRef = useRef(false);

  // Fixed size (300), so no ResizeObserver — mirrors RadarChart's fixed-size
  // branch (size={300}), which skips ParentSize. d3 owns the whole <svg>.
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const cs = getComputedStyle(containerRef.current);
    // --border is undefined in the demo (the Visx grid/axes fall back to
    // stroke:none and vanish); resolveColor's fallback keeps them visible here,
    // and globals.css now defines --border so both cards match.
    const border = resolveColor(cs, "var(--border)", "rgba(0,0,0,0.1)");
    const labelColor = resolveColor(cs, "var(--chart-label)", "rgba(0,0,0,0.55)");
    const mutedColor = resolveColor(cs, "var(--chart-foreground-muted)", "rgba(0,0,0,0.55)");
    const bg = resolveColor(cs, "var(--chart-background)", "#ffffff");

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const animate = !hasAnimatedRef.current;

    // Grid / axes / labels live under one center-translated group (no hover
    // scale needed, so a plain SVG translate is enough).
    const base = svg.append("g").attr("transform", `translate(${CENTER},${CENTER})`);

    // ---- Grid pentagons (one <g> per level so each can scale in about center) ----
    const gridDegs = d3.range(radarMetrics.length).map((i) => (i * 360) / radarMetrics.length + 36);
    const gridLevels = d3.range(LEVELS).map((L) => {
      const r = ((L + 1) * RADIUS) / LEVELS;
      const pts = gridDegs.map((deg) => {
        const [x, y] = gridVertex(deg, r);
        return { x, y };
      });
      return { level: L, r, d: polyPath(pts) };
    });

    const gridG = base.append("g").attr("class", "grid");
    const levelG = gridG
      .selectAll<SVGGElement, (typeof gridLevels)[number]>("g.level")
      .data(gridLevels)
      .join("g")
      .attr("class", "level");

    levelG
      .append("path")
      .attr("d", (d) => d.d)
      .attr("fill", "none")
      .attr("stroke", border)
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1)
      .attr("stroke-linecap", "round");

    if (animate) {
      levelG
        .attr("transform", "scale(0.001)")
        .style("opacity", 0)
        .transition()
        .delay((_d, i) => i * 80)
        .duration(600)
        .ease(d3.easeCubicOut)
        .attr("transform", "scale(1)")
        .style("opacity", 1);
    } else {
      levelG.attr("transform", "scale(1)").style("opacity", 1);
    }

    // ---- Level value labels (20…100) along the top axis ----
    const levelLabels = base
      .append("g")
      .attr("class", "level-labels")
      .selectAll("text")
      .data(d3.range(LEVELS))
      .join("text")
      .attr("x", 4)
      .attr("y", (i) => -((i + 1) * RADIUS) / LEVELS)
      .attr("dominant-baseline", "middle")
      .attr("text-anchor", "start")
      .attr("font-size", 9)
      .attr("fill", mutedColor)
      .text((i) => ((i + 1) * 100) / LEVELS);

    if (animate) {
      levelLabels
        .style("opacity", 0)
        .transition()
        .delay((i) => 200 + i * 60)
        .duration(400)
        .style("opacity", 1);
    }

    // ---- Radial axes (one line per metric, grows out from center) ----
    const axes = radarMetrics.map((_, i) => {
      const a = axisAngle(i);
      return { x2: RADIUS * Math.cos(a), y2: RADIUS * Math.sin(a) };
    });

    const axisSel = base
      .append("g")
      .attr("class", "axes")
      .selectAll<SVGLineElement, (typeof axes)[number]>("line")
      .data(axes)
      .join("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("stroke", border)
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1);

    if (animate) {
      axisSel
        .attr("x2", 0)
        .attr("y2", 0)
        .transition()
        .delay((_d, i) => i * 50)
        .duration(700)
        .ease(d3.easeCubicOut)
        .attr("x2", (d) => d.x2)
        .attr("y2", (d) => d.y2);
    } else {
      axisSel.attr("x2", (d) => d.x2).attr("y2", (d) => d.y2);
    }

    // ---- Metric labels (Speed, Power, …) at radius + offset ----
    const labelR = RADIUS + LABEL_OFFSET;
    const metricLabels = radarMetrics.map((m, i) => {
      const a = axisAngle(i);
      return { label: m.label, x: labelR * Math.cos(a), y: labelR * Math.sin(a) };
    });

    const labelG = base
      .append("g")
      .attr("class", "metric-labels")
      .selectAll<SVGGElement, (typeof metricLabels)[number]>("g")
      .data(metricLabels)
      .join("g");

    labelG
      .append("text")
      .attr("dominant-baseline", "middle")
      .attr("text-anchor", "middle")
      .attr("font-size", 11)
      .attr("font-weight", 500)
      .attr("fill", labelColor)
      .text((d) => d.label);

    if (animate) {
      labelG
        .attr("transform", "translate(0,0)")
        .style("opacity", 0)
        .transition()
        .delay((_d, i) => 200 + i * 80)
        .duration(500)
        .ease(d3.easeCubicOut)
        .attr("transform", (d) => `translate(${d.x},${d.y})`)
        .style("opacity", 1);
    } else {
      labelG.attr("transform", (d) => `translate(${d.x},${d.y})`).style("opacity", 1);
    }

    // ---- Data polygons (Player A, Player B) ----
    const areas: AreaDatum[] = radarData.map((d, i) => ({
      index: i,
      label: d.label,
      color: resolveColor(cs, d.color ?? "", PALETTE_FALLBACK[i % PALETTE_FALLBACK.length]),
      targets: radarMetrics.map((m, mi) => pointPos(mi, d.values[m.key] ?? 0)),
    }));

    // Each area is its own group, centered + hover-scaled via a CSS transform
    // (transform-box:view-box + origin 0,0 pivots the 1.05 scale about the chart
    // center, since the polygon is generated around 0,0). Appended after the
    // grid/axes so the fills sit on top.
    const areaG = svg
      .selectAll<SVGGElement, AreaDatum>("g.area")
      .data(areas)
      .join("g")
      .attr("class", "area")
      .style("cursor", "pointer")
      .style("transform-box", "view-box")
      .style("transform-origin", "0px 0px")
      .style("transform", `translate(${CENTER}px,${CENTER}px) scale(1)`)
      .style(
        "transition",
        "transform 0.2s cubic-bezier(0.34,1.56,0.64,1), opacity 0.15s ease"
      );

    const areaPath = areaG
      .append("path")
      .attr("fill", (a) => a.color)
      .attr("stroke", (a) => a.color)
      .attr("stroke-linejoin", "round")
      .style("fill-opacity", 0.15)
      .style("stroke-width", 2)
      .style("transition", "fill-opacity 0.2s ease, stroke-width 0.2s ease, filter 0.15s ease");

    const pointSel = areaG
      .selectAll<SVGCircleElement, { x: number; y: number }>("circle")
      .data((a) => a.targets)
      .join("circle")
      .attr("fill", function () {
        return (d3.select(this.parentNode as SVGGElement).datum() as AreaDatum).color;
      })
      .attr("stroke", bg)
      .attr("stroke-width", 2)
      .style("r", "4px")
      .style("transition", "r 0.2s ease");

    // Entrance: grow the polygon + points out from the center (scalar t), fade
    // the group in. Staggered after the grid settles. Baked on later redraws.
    const areaDelay = (i: number) => 600 + i * 150;
    if (animate) {
      areaPath
        .attr("d", (a) => polyPath(a.targets.map(() => ({ x: 0, y: 0 }))))
        .transition()
        .delay((a) => areaDelay(a.index))
        .duration(700)
        .ease(d3.easeCubicOut)
        .attrTween("d", (a) => (t) =>
          polyPath(a.targets.map((p) => ({ x: p.x * t, y: p.y * t })))
        );

      pointSel
        .attr("cx", 0)
        .attr("cy", 0)
        .transition()
        .delay(function () {
          const a = d3.select(this.parentNode as SVGGElement).datum() as AreaDatum;
          return areaDelay(a.index);
        })
        .duration(700)
        .ease(d3.easeCubicOut)
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y);

      areaG
        .style("opacity", 0)
        .transition()
        .delay((a) => areaDelay(a.index))
        .duration(400)
        .style("opacity", 1);
    } else {
      areaPath.attr("d", (a) => polyPath(a.targets));
      pointSel.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      areaG.style("opacity", 1);
    }
    hasAnimatedRef.current = true;

    // Hover via synchronous CSS-transition style sets (not rAF), so the target
    // values land in the inline style immediately and stay verifiable.
    const applyHover = (h: number | null) => {
      areaG.each(function (a) {
        const g = d3.select(this);
        const hovered = h === a.index;
        const other = h !== null && h !== a.index;
        g.style(
          "transform",
          `translate(${CENTER}px,${CENTER}px) scale(${hovered ? 1.05 : 1})`
        ).style("opacity", other ? 0.3 : 1);
        g.select("path")
          .style("fill-opacity", hovered ? 0.35 : 0.15)
          .style("stroke-width", hovered ? 3 : 2)
          .style("filter", hovered ? `drop-shadow(0 0 12px ${a.color})` : "none");
        g.selectAll("circle").style("r", hovered ? "6px" : "4px");
      });
    };

    areaG
      .on("mouseenter", (_event, a) => applyHover(a.index))
      .on("mouseleave", () => applyHover(null));
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative", width: SIZE, height: SIZE }}>
      <svg height={SIZE} ref={svgRef} style={{ overflow: "visible" }} width={SIZE} />
    </div>
  );
}
