"use client";

// Reference implementation: the Composed chart drawn with RAW d3 (d3-selection +
// d3-transition owning the SVG via a ref) instead of Visx/Motion rendering.
// Mirrors the Visx Composed card: a single shared y-scale across all three
// series, so the runRate area (--chart-4) and revenue line (--chart-1) fill the
// upper band while the units bars (--chart-3) read as slivers at the bottom.
// One left-to-right clip reveal unveils every mark together; hover shows a
// tooltip with all three values plus focus dots (no crosshair, matching
// showCrosshair={false}).

import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

import { composedData } from "./sample-data";

type Datum = (typeof composedData)[number];

const HEIGHT = 200;
const MARGIN = { top: 16, right: 20, bottom: 28, left: 44 };
const MAX_BAR_SIZE = 28;
const BAR_RADIUS = 4;

const AREA = { key: "runRate" as const, label: "Run rate", cssVar: "--chart-4", fallback: "#f59e0b" };
const BAR = { key: "units" as const, label: "Units", color: "var(--chart-3)" };
const LINE = { key: "revenue" as const, label: "Revenue", color: "var(--chart-1)" };

export function RawD3Composed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const idRef = useRef("rawd3-composed-" + Math.random().toString(36).slice(2, 9));
  const hasAnimatedRef = useRef(false);
  const [width, setWidth] = useState(0);

  // React owns the container; measure it and feed the width to d3.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Seed width synchronously so the first draw doesn't wait on an async
    // ResizeObserver callback (delivery is tied to the rendering pipeline, which
    // a backgrounded tab can defer). The observer then handles later resizes.
    setWidth(Math.round(el.getBoundingClientRect().width));
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

    // Resolve the area's CSS-variable color to a concrete value so gradient
    // stops are reliable (SVG gradients don't pick up CSS vars in every engine).
    const cs = getComputedStyle(containerRef.current);
    const areaColor = cs.getPropertyValue(AREA.cssVar).trim() || AREA.fallback;

    const uid = idRef.current;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const container = d3.select(containerRef.current);
    container.selectAll(".rawd3-tooltip").remove();

    const defs = svg.append("defs");
    const root = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    // x range [0, innerW] with no padding (matches Visx) — the first/last points
    // sit on the edges, so the edge bars are half-clipped.
    const x = d3
      .scaleTime()
      .domain(d3.extent(composedData, (d) => d.date) as [Date, Date])
      .range([0, innerW]);

    // one shared y-scale spanning every series' values (the faithful behavior:
    // bars are tiny because they share the line/area's large domain).
    const maxVal =
      d3.max(composedData, (d) => Math.max(d.revenue, d.runRate, d.units)) ?? 0;
    const y = d3
      .scaleLinear()
      .domain([0, maxVal * 1.1])
      .range([innerH, 0])
      .nice();

    const columnWidth = innerW / Math.max(composedData.length - 1, 1);
    const barWidth = Math.min(columnWidth * 0.88, MAX_BAR_SIZE);

    // area gradient (color at top -> transparent at bottom), fillOpacity 0.32
    const grad = defs
      .append("linearGradient")
      .attr("id", `${uid}-area`)
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", 1);
    grad.append("stop").attr("offset", "0%").attr("stop-color", areaColor).attr("stop-opacity", 0.32);
    grad.append("stop").attr("offset", "100%").attr("stop-color", areaColor).attr("stop-opacity", 0.02);

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
          .ticks(6)
          .tickFormat((d) => d3.timeFormat("%b")(d as Date))
          .tickSize(0)
          .tickPadding(10)
      );
    xAxis.select(".domain").remove();
    xAxis
      .selectAll("text")
      .attr("fill", "var(--chart-axis, #94a3b8)")
      .attr("font-size", 11);

    // y axis (compact SI labels: 20k, 10k, …)
    const yAxis = root
      .append("g")
      .call(d3.axisLeft(y).ticks(4).tickFormat(d3.format("~s")).tickSize(0).tickPadding(8));
    yAxis.select(".domain").remove();
    yAxis
      .selectAll("text")
      .attr("fill", "var(--chart-axis, #94a3b8)")
      .attr("font-size", 11);

    // revealed group: area + bars + line, unveiled together by the clip wipe
    const revealed = root.append("g").attr("clip-path", `url(#${uid}-clip)`);

    const areaGen = d3
      .area<Datum>()
      .x((d) => x(d.date))
      .y0(y(0))
      .y1((d) => y(d.runRate))
      .curve(d3.curveMonotoneX);

    const areaLineGen = d3
      .line<Datum>()
      .x((d) => x(d.date))
      .y((d) => y(d.runRate))
      .curve(d3.curveMonotoneX);

    revealed
      .append("path")
      .datum(composedData)
      .attr("fill", `url(#${uid}-area)`)
      .attr("d", areaGen);

    revealed
      .append("path")
      .datum(composedData)
      .attr("fill", "none")
      .attr("stroke", areaColor)
      .attr("stroke-width", 2)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .attr("d", areaLineGen);

    // units bars: centered on each x, rounded top, hugging the baseline
    revealed
      .append("g")
      .selectAll<SVGRectElement, Datum>("rect")
      .data(composedData)
      .join("rect")
      .attr("x", (d) => x(d.date) - barWidth / 2)
      .attr("y", (d) => y(d.units))
      .attr("width", barWidth)
      .attr("height", (d) => innerH - y(d.units))
      .attr("rx", BAR_RADIUS)
      .attr("ry", BAR_RADIUS)
      .attr("fill", BAR.color);

    // revenue line on top
    const lineGen = d3
      .line<Datum>()
      .x((d) => x(d.date))
      .y((d) => y(d.revenue))
      .curve(d3.curveMonotoneX);

    revealed
      .append("path")
      .datum(composedData)
      .attr("fill", "none")
      .attr("stroke", LINE.color)
      .attr("stroke-width", 2.5)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .attr("d", lineGen);

    // Play the left-to-right wipe only on the first real draw. Later redraws keep
    // the baked-in full width, so an interrupted transition can't strand the clip.
    if (!hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      clipRect
        .attr("width", 0)
        .transition()
        .duration(900)
        .ease(d3.easeCubicInOut)
        .attr("width", innerW);
    }

    // hover: focus dots on the line + area, HTML tooltip, NO crosshair
    const focusRevenue = root
      .append("circle")
      .attr("r", 4)
      .attr("fill", "white")
      .attr("stroke", LINE.color)
      .attr("stroke-width", 2)
      .style("opacity", 0)
      .style("pointer-events", "none");

    const focusRunRate = root
      .append("circle")
      .attr("r", 4)
      .attr("fill", "white")
      .attr("stroke", areaColor)
      .attr("stroke-width", 2)
      .style("opacity", 0)
      .style("pointer-events", "none");

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
    const fmtDate = d3.timeFormat("%b %Y");
    const fmtMoney = d3.format("$,.0f");
    const fmtNum = d3.format(",");

    const row = (color: string, label: string, value: string) =>
      `<div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
         <span style="width:8px;height:8px;border-radius:9999px;background:${color};display:inline-block;"></span>
         <span style="color:#64748b;">${label}</span>
         <span style="margin-left:auto;font-weight:600;">${value}</span>
       </div>`;

    root
      .append("rect")
      .attr("width", innerW)
      .attr("height", innerH)
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mousemove", (event: MouseEvent) => {
        const [mx] = d3.pointer(event);
        const d = composedData[bisectDate(composedData, x.invert(mx))];
        if (!d) return;
        const cx = x(d.date);

        focusRevenue.attr("cx", cx).attr("cy", y(d.revenue)).style("opacity", 1);
        focusRunRate.attr("cx", cx).attr("cy", y(d.runRate)).style("opacity", 1);

        tooltip
          .html(
            `<div style="font-weight:600;">${fmtDate(d.date)}</div>` +
              row(LINE.color, LINE.label, fmtMoney(d.revenue)) +
              row(areaColor, AREA.label, fmtMoney(d.runRate)) +
              row(BAR.color, BAR.label, fmtNum(d.units))
          )
          .style("left", `${cx + MARGIN.left}px`)
          .style("top", `${Math.min(y(d.revenue), y(d.runRate)) + MARGIN.top}px`)
          .style("opacity", "1");
      })
      .on("mouseleave", () => {
        focusRevenue.style("opacity", 0);
        focusRunRate.style("opacity", 0);
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
