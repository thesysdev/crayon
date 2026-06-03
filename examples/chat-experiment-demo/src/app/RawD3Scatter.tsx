"use client";

// Reference implementation: the Scatter chart drawn with RAW d3 (d3-selection +
// d3-transition owning the SVG via a ref) instead of Visx/React rendering.
// Mirrors the Visx Scatter card: ring markers for two series (sessions +
// conversions), a scale-in entrance, fade/blur of the non-hovered points on
// hover, and an HTML tooltip for the hovered point.

import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

import { scatterData } from "./sample-data";

const SERIES: { key: "sessions" | "conversions"; label: string; color: string }[] = [
  { key: "sessions", label: "Sessions", color: "var(--chart-line-primary)" },
  { key: "conversions", label: "Conversions", color: "var(--chart-line-secondary)" },
];

const HEIGHT = 200;
const MARGIN = { top: 16, right: 20, bottom: 28, left: 44 };
const DOT_R = 6;

type Pt = {
  date: Date;
  value: number;
  label: string;
  color: string;
};

export function RawD3Scatter() {
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

    const x = d3
      .scaleTime()
      .domain(d3.extent(scatterData, (d) => d.date) as [Date, Date])
      .range([0, innerW]);

    const maxY =
      d3.max(scatterData, (d) => Math.max(d.sessions, d.conversions)) ?? 0;
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

    // x axis
    const xAxis = root
      .append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(5)
          .tickFormat((d) => d3.timeFormat("%b %d")(d as Date))
          .tickSize(0)
          .tickPadding(10)
      );
    xAxis.select(".domain").remove();
    xAxis
      .selectAll("text")
      .attr("fill", "var(--chart-axis, #94a3b8)")
      .attr("font-size", 11);

    // y axis
    const yAxis = root
      .append("g")
      .call(d3.axisLeft(y).ticks(4).tickFormat(d3.format(",")).tickSize(0).tickPadding(8));
    yAxis.select(".domain").remove();
    yAxis
      .selectAll("text")
      .attr("fill", "var(--chart-axis, #94a3b8)")
      .attr("font-size", 11);

    // flatten both series into one set of ring markers
    const points: Pt[] = [];
    scatterData.forEach((d) => {
      SERIES.forEach((s) => {
        points.push({ date: d.date, value: d[s.key], label: s.label, color: s.color });
      });
    });

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

    const fmtDate = d3.timeFormat("%b %Y");
    const fmtNum = d3.format(",");

    // ring markers: translucent fill + solid stroke reads as a ring
    const dots = root
      .append("g")
      .selectAll<SVGCircleElement, Pt>("circle")
      .data(points)
      .join("circle")
      .attr("class", "scatter-dot")
      .attr("cx", (p) => x(p.date))
      .attr("cy", (p) => y(p.value))
      .attr("fill", (p) => p.color)
      .attr("fill-opacity", 0.25)
      .attr("stroke", (p) => p.color)
      .attr("stroke-width", 2)
      .style("cursor", "pointer");

    // fade + blur every other marker while one is hovered
    dots
      .on("mouseenter", (event: MouseEvent, p) => {
        dots
          .style("opacity", (q) => (q === p ? 1 : 0.18))
          .style("filter", (q) => (q === p ? "none" : "blur(2px)"));
        d3.select(event.currentTarget as SVGCircleElement)
          .attr("r", DOT_R + 2)
          .raise();
        tooltip
          .html(
            `<div style="font-weight:600;">${fmtDate(p.date)}</div>
             <div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
               <span style="width:8px;height:8px;border-radius:9999px;background:${p.color};display:inline-block;"></span>
               <span style="color:#64748b;">${p.label}</span>
               <span style="margin-left:auto;font-weight:600;">${fmtNum(p.value)}</span>
             </div>`
          )
          .style("left", `${x(p.date) + MARGIN.left}px`)
          .style("top", `${y(p.value) + MARGIN.top}px`)
          .style("opacity", "1");
      })
      .on("mouseleave", () => {
        dots.style("opacity", 1).style("filter", "none").attr("r", DOT_R);
        tooltip.style("opacity", "0");
      });

    const animate = !hasAnimatedRef.current;
    if (animate) {
      // pop each marker in with a slight spring overshoot, staggered by index;
      // later redraws skip it so an interrupted transition can't strand r=0.
      dots
        .attr("r", 0)
        .transition()
        .delay((_p, i) => i * 22)
        .duration(480)
        .ease(d3.easeBackOut.overshoot(1.6))
        .attr("r", DOT_R);
    } else {
      dots.attr("r", DOT_R);
    }
    hasAnimatedRef.current = true;

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
