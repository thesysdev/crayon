"use client";

// Reference implementation: the Area chart drawn with RAW d3 (d3-selection +
// d3-transition owning the SVG via a ref) instead of Visx/React rendering.
// Mirrors the Visx Area card: two gradient-filled areas, a left-to-right clip
// reveal (the area-chart analog of Visx's clip-path wipe), and a hover crosshair
// + focus dots + tooltip.

import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

import { areaData } from "./sample-data";

type Datum = (typeof areaData)[number];

const SERIES: { key: "revenue" | "costs"; label: string; cssVar: string; fallback: string }[] = [
  { key: "revenue", label: "Revenue", cssVar: "--chart-line-primary", fallback: "#6366f1" },
  { key: "costs", label: "Costs", cssVar: "--chart-line-secondary", fallback: "#22c55e" },
];

const HEIGHT = 200;
const MARGIN = { top: 16, right: 20, bottom: 28, left: 52 };

export function RawD3Area() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const idRef = useRef("rawd3-area-" + Math.random().toString(36).slice(2, 9));
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

    // Resolve CSS-variable colors to concrete values so gradient stops are reliable.
    const cs = getComputedStyle(containerRef.current);
    const colors = SERIES.map(
      (s) => cs.getPropertyValue(s.cssVar).trim() || s.fallback
    );

    const uid = idRef.current;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const container = d3.select(containerRef.current);
    container.selectAll(".rawd3-tooltip").remove();

    const defs = svg.append("defs");
    const root = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const x = d3
      .scaleTime()
      .domain(d3.extent(areaData, (d) => d.date) as [Date, Date])
      .range([0, innerW]);

    const maxY = d3.max(areaData, (d) => Math.max(d.revenue, d.costs)) ?? 0;
    const y = d3
      .scaleLinear()
      .domain([0, maxY * 1.1])
      .range([innerH, 0])
      .nice();

    // gradient fill per series (color at top -> transparent at bottom)
    SERIES.forEach((s, i) => {
      const grad = defs
        .append("linearGradient")
        .attr("id", `${uid}-grad-${s.key}`)
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", 1);
      grad
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colors[i])
        .attr("stop-opacity", 0.45);
      grad
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colors[i])
        .attr("stop-opacity", 0.02);
    });

    // clip rect for the left-to-right reveal; base state = fully revealed so an
    // interrupted or re-run effect settles to "shown" rather than a partial width.
    const clipRect = defs
      .append("clipPath")
      .attr("id", `${uid}-clip`)
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", innerW)
      .attr("height", innerH);

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

    // revealed group: areas + stroke lines, clipped by the animating rect
    const revealed = root.append("g").attr("clip-path", `url(#${uid}-clip)`);

    SERIES.forEach((s, i) => {
      const area = d3
        .area<Datum>()
        .x((d) => x(d.date))
        .y0(y(0))
        .y1((d) => y(d[s.key]))
        .curve(d3.curveMonotoneX);

      const line = d3
        .line<Datum>()
        .x((d) => x(d.date))
        .y((d) => y(d[s.key]))
        .curve(d3.curveMonotoneX);

      revealed
        .append("path")
        .datum(areaData)
        .attr("fill", `url(#${uid}-grad-${s.key})`)
        .attr("d", area);

      revealed
        .append("path")
        .datum(areaData)
        .attr("fill", "none")
        .attr("stroke", colors[i])
        .attr("stroke-width", 2)
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .attr("d", line);
    });

    // Play the left-to-right wipe only on the first real draw. Later redraws
    // (StrictMode double-mount, ResizeObserver width changes) keep the baked-in
    // full width, so an interrupted transition can never strand the clip.
    if (!hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      clipRect
        .attr("width", 0)
        .transition()
        .duration(900)
        .ease(d3.easeCubicInOut)
        .attr("width", innerW);
    }

    // hover interaction: crosshair + focus dots + HTML tooltip
    const focusLine = root
      .append("line")
      .attr("y1", 0)
      .attr("y2", innerH)
      .attr("stroke", "var(--chart-crosshair, #94a3b8)")
      .attr("stroke-width", 1)
      .style("opacity", 0)
      .style("pointer-events", "none");

    const focusDots = SERIES.map((_, i) =>
      root
        .append("circle")
        .attr("r", 4)
        .attr("fill", "white")
        .attr("stroke", colors[i])
        .attr("stroke-width", 2)
        .style("opacity", 0)
        .style("pointer-events", "none")
    );

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

    const bisectDate = d3.bisector<Datum, Date>((d) => d.date).center;
    const fmtDate = d3.timeFormat("%b %d, %Y");
    const fmtNum = d3.format("$,.0f");

    root
      .append("rect")
      .attr("width", innerW)
      .attr("height", innerH)
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mousemove", (event: MouseEvent) => {
        const [mx, my] = d3.pointer(event);
        const d = areaData[bisectDate(areaData, x.invert(mx))];
        if (!d) return;
        const cx = x(d.date);

        focusLine.attr("x1", cx).attr("x2", cx).style("opacity", 1);
        focusDots.forEach((dot, i) =>
          dot.attr("cx", cx).attr("cy", y(d[SERIES[i].key])).style("opacity", 1)
        );

        const rows = SERIES.map(
          (s, i) =>
            `<div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
               <span style="width:8px;height:8px;border-radius:9999px;background:${colors[i]};display:inline-block;"></span>
               <span style="color:#64748b;">${s.label}</span>
               <span style="margin-left:auto;font-weight:600;">${fmtNum(d[s.key])}</span>
             </div>`
        ).join("");

        tooltip
          .html(`<div style="font-weight:600;">${fmtDate(d.date)}</div>${rows}`)
          .style("left", `${cx + MARGIN.left}px`)
          .style("top", `${my + MARGIN.top}px`)
          .style("opacity", "1");
      })
      .on("mouseleave", () => {
        focusLine.style("opacity", 0);
        focusDots.forEach((dot) => dot.style("opacity", 0));
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
