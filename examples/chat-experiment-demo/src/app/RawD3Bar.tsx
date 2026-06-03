"use client";

// Reference implementation: the Bar chart drawn with RAW d3 (d3-selection +
// d3-transition owning the SVG via a ref) instead of Visx/React rendering.
// Mirrors the Visx Bar card: grouped bars (revenue + profit per month), a
// spring-style entrance that grows each bar up from the baseline, hover-dim of
// the non-hovered month, rounded bar tops, and an HTML tooltip.

import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

import { barData } from "./sample-data";

type Datum = (typeof barData)[number];

const SERIES: { key: "revenue" | "profit"; label: string; color: string }[] = [
  { key: "revenue", label: "Revenue", color: "var(--chart-line-primary)" },
  { key: "profit", label: "Profit", color: "var(--chart-line-secondary)" },
];

const HEIGHT = 200;
const MARGIN = { top: 16, right: 20, bottom: 28, left: 52 };
const BAR_RADIUS = 5;

type BarSpec = {
  month: string;
  key: "revenue" | "profit";
  color: string;
  value: number;
  bx: number;
  bw: number;
};

// Rounded-top rect emitted as a path so the entrance can grow the bar from a
// flat baseline while keeping the rounded corners (the raw-d3 stand-in for
// Visx's lineCap="round"). The path command structure is constant, so a plain
// attr("d") transition interpolates it smoothly.
function barPath(bx: number, by: number, bw: number, bh: number) {
  const r = Math.max(0, Math.min(BAR_RADIUS, bw / 2, bh));
  return (
    `M${bx},${by + bh}` +
    `L${bx},${by + r}` +
    `Q${bx},${by} ${bx + r},${by}` +
    `L${bx + bw - r},${by}` +
    `Q${bx + bw},${by} ${bx + bw},${by + r}` +
    `L${bx + bw},${by + bh}Z`
  );
}

export function RawD3Bar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const hasAnimatedRef = useRef(false);
  const [width, setWidth] = useState(0);

  // React owns the container; measure it and feed the width to d3.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setWidth(Math.round(entries[0]?.contentRect.width ?? 0));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // d3 owns everything inside the <svg> ref.
  useEffect(() => {
    if (!width || !svgRef.current || !containerRef.current) return;

    const innerW = width - MARGIN.left - MARGIN.right;
    const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;
    if (innerW <= 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const container = d3.select(containerRef.current);
    container.selectAll(".rawd3-tooltip").remove();

    const root = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    // outer band per month, inner band per series (grouped bars)
    const x0 = d3
      .scaleBand<string>()
      .domain(barData.map((d) => d.month))
      .range([0, innerW])
      .paddingInner(0.35)
      .paddingOuter(0.2);

    const x1 = d3
      .scaleBand<string>()
      .domain(SERIES.map((s) => s.key))
      .range([0, x0.bandwidth()])
      .padding(0.18);

    const maxY = d3.max(barData, (d) => Math.max(d.revenue, d.profit)) ?? 0;
    const y = d3
      .scaleLinear()
      .domain([0, maxY * 1.1])
      .range([innerH, 0])
      .nice();

    // horizontal gridlines
    root
      .append("g")
      .selectAll("line")
      .data(y.ticks(4))
      .join("line")
      .attr("x1", 0)
      .attr("x2", innerW)
      .attr("y1", (d) => y(d))
      .attr("y2", (d) => y(d))
      .attr("stroke", "var(--chart-grid, #e2e8f0)")
      .attr("stroke-dasharray", "3,3");

    // y axis
    const yAxis = root
      .append("g")
      .call(
        d3.axisLeft(y).ticks(4).tickFormat(d3.format(",")).tickSize(0).tickPadding(8)
      );
    yAxis.select(".domain").remove();
    yAxis
      .selectAll("text")
      .attr("fill", "var(--chart-axis, #94a3b8)")
      .attr("font-size", 11);

    // x axis (month labels)
    const xAxis = root
      .append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x0).tickSize(0).tickPadding(10));
    xAxis.select(".domain").remove();
    xAxis
      .selectAll("text")
      .attr("fill", "var(--chart-axis, #94a3b8)")
      .attr("font-size", 11);

    // flatten to one path per (month, series) so the join + entrance stay simple
    const bars: BarSpec[] = [];
    barData.forEach((d) => {
      SERIES.forEach((s) => {
        bars.push({
          month: d.month,
          key: s.key,
          color: s.color,
          value: d[s.key],
          bx: (x0(d.month) ?? 0) + (x1(s.key) ?? 0),
          bw: x1.bandwidth(),
        });
      });
    });

    const animate = !hasAnimatedRef.current;
    const barSel = root
      .append("g")
      .selectAll<SVGPathElement, BarSpec>("path")
      .data(bars)
      .join("path")
      .attr("class", "bar")
      .attr("fill", (b) => b.color);

    if (animate) {
      // grow each bar up from the baseline with a slight spring overshoot,
      // staggered by month then series.
      barSel
        .attr("d", (b) => barPath(b.bx, innerH, b.bw, 0))
        .transition()
        .delay((_b, i) => Math.floor(i / SERIES.length) * 70 + (i % SERIES.length) * 30)
        .duration(720)
        .ease(d3.easeBackOut.overshoot(1.4))
        .attr("d", (b) => barPath(b.bx, y(b.value), b.bw, innerH - y(b.value)));
    } else {
      // later redraws (resize, StrictMode double-mount) skip the entrance so an
      // interrupted transition can't strand a bar mid-grow.
      barSel.attr("d", (b) => barPath(b.bx, y(b.value), b.bw, innerH - y(b.value)));
    }
    hasAnimatedRef.current = true;

    // HTML tooltip
    const tooltip = container
      .append("div")
      .attr("class", "rawd3-tooltip")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("opacity", "0")
      .style("background", "rgba(255,255,255,0.96)")
      .style("border", "1px solid #e2e8f0")
      .style("border-radius", "8px")
      .style("box-shadow", "0 4px 16px rgba(0,0,0,0.08)")
      .style("padding", "8px 10px")
      .style("font-size", "12px")
      .style("color", "#0f172a")
      .style("transform", "translate(-50%, calc(-100% - 14px))")
      .style("white-space", "nowrap");

    const fmtNum = d3.format("$,.0f");

    // hover-dim: a transparent overlay per month band dims the other months and
    // drives the tooltip (hovering anywhere in a group selects that month).
    root
      .append("g")
      .selectAll<SVGRectElement, Datum>("rect")
      .data(barData)
      .join("rect")
      .attr("x", (d) => x0(d.month) ?? 0)
      .attr("y", 0)
      .attr("width", x0.bandwidth())
      .attr("height", innerH)
      .style("fill", "transparent")
      .style("pointer-events", "all")
      .on("mouseenter", (_event, d) => {
        barSel.style("opacity", (b) => (b.month === d.month ? 1 : 0.25));

        const rows = SERIES.map(
          (s) =>
            `<div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
               <span style="width:8px;height:8px;border-radius:9999px;background:${s.color};display:inline-block;"></span>
               <span style="color:#64748b;">${s.label}</span>
               <span style="margin-left:auto;font-weight:600;">${fmtNum(d[s.key])}</span>
             </div>`
        ).join("");

        const cx = (x0(d.month) ?? 0) + x0.bandwidth() / 2;
        const topY = y(Math.max(d.revenue, d.profit));
        tooltip
          .html(`<div style="font-weight:600;">${d.month}</div>${rows}`)
          .style("left", `${cx + MARGIN.left}px`)
          .style("top", `${topY + MARGIN.top}px`)
          .style("opacity", "1");
      })
      .on("mouseleave", () => {
        barSel.style("opacity", 1);
        tooltip.style("opacity", "0");
      });

    return () => {
      container.selectAll(".rawd3-tooltip").remove();
    };
  }, [width]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <svg height={HEIGHT} ref={svgRef} width={width} />
    </div>
  );
}
