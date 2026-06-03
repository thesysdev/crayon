"use client";

// Reference implementation: the Line chart drawn with RAW d3 (d3-selection +
// d3-transition owning the SVG via a ref) instead of Visx/React rendering.
// Mirrors the Visx Line card's data and interactions (animated draw-in, hover
// crosshair + focus dots + tooltip) so the two can be compared side by side.

import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

import { lineData } from "./sample-data";

type Datum = (typeof lineData)[number];

const SERIES: { key: "users" | "pageviews"; label: string; color: string }[] = [
  { key: "users", label: "Users", color: "var(--chart-line-primary)" },
  { key: "pageviews", label: "Pageviews", color: "var(--chart-line-secondary)" },
];

const HEIGHT = 200;
const MARGIN = { top: 16, right: 20, bottom: 28, left: 44 };

export function RawD3Line() {
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
      .domain(d3.extent(lineData, (d) => d.date) as [Date, Date])
      .range([0, innerW]);

    const maxY = d3.max(lineData, (d) => Math.max(d.users, d.pageviews)) ?? 0;
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
      .call(d3.axisLeft(y).ticks(4).tickSize(0).tickPadding(8));
    yAxis.select(".domain").remove();
    yAxis
      .selectAll("text")
      .attr("fill", "var(--chart-axis, #94a3b8)")
      .attr("font-size", 11);

    // lines with stroke-dashoffset draw-in (raw-d3 stand-in for the Visx clip
    // reveal). Animate only on the first real draw; later redraws keep the line
    // fully drawn, so an interrupted transition can't strand it half-hidden.
    const animate = !hasAnimatedRef.current;
    SERIES.forEach((s) => {
      const lineGen = d3
        .line<Datum>()
        .x((d) => x(d.date))
        .y((d) => y(d[s.key]))
        .curve(d3.curveMonotoneX);

      const path = root
        .append("path")
        .datum(lineData)
        .attr("fill", "none")
        .attr("stroke", s.color)
        .attr("stroke-width", 2)
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .attr("d", lineGen);

      if (animate) {
        const total = (path.node() as SVGPathElement).getTotalLength();
        path
          .attr("stroke-dasharray", `${total} ${total}`)
          .attr("stroke-dashoffset", total)
          .transition()
          .duration(900)
          .ease(d3.easeCubicInOut)
          .attr("stroke-dashoffset", 0);
      }
    });
    hasAnimatedRef.current = true;

    // hover interaction: crosshair + focus dots + HTML tooltip
    const focusLine = root
      .append("line")
      .attr("y1", 0)
      .attr("y2", innerH)
      .attr("stroke", "var(--chart-crosshair, #94a3b8)")
      .attr("stroke-width", 1)
      .style("opacity", 0)
      .style("pointer-events", "none");

    const focusDots = SERIES.map((s) =>
      root
        .append("circle")
        .attr("r", 4)
        .attr("fill", "white")
        .attr("stroke", s.color)
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
    const fmtNum = d3.format(",");

    root
      .append("rect")
      .attr("width", innerW)
      .attr("height", innerH)
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mousemove", (event: MouseEvent) => {
        const [mx, my] = d3.pointer(event);
        const d = lineData[bisectDate(lineData, x.invert(mx))];
        if (!d) return;
        const cx = x(d.date);

        focusLine.attr("x1", cx).attr("x2", cx).style("opacity", 1);
        focusDots.forEach((dot, i) =>
          dot.attr("cx", cx).attr("cy", y(d[SERIES[i].key])).style("opacity", 1)
        );

        const rows = SERIES.map(
          (s) =>
            `<div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
               <span style="width:8px;height:8px;border-radius:9999px;background:${s.color};display:inline-block;"></span>
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
