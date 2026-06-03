"use client";

// Reference implementation: the Candlestick chart drawn with RAW d3 (d3-selection
// + d3-transition owning the SVG via a ref) instead of Visx/Motion rendering.
// Mirrors the Visx Candlestick card: a thin wick rect (high->low) plus a rounded
// body rect (open->close) per OHLC point, positive candles in --chart-1 and
// negative in --chart-5, a staggered scaleY entrance that grows each candle from
// its vertical center, hover-dim of the non-hovered candles, and an OHLC tooltip.

import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

import { ohlcData, type OHLC } from "./sample-data";

const HEIGHT = 200;
const MARGIN = { top: 16, right: 20, bottom: 28, left: 44 };
const WICK_WIDTH = 1.5;
const CANDLE_GAP = 0.2; // gap between candles as a fraction of the slot width
const POSITIVE = "var(--chart-1)";
const NEGATIVE = "var(--chart-5)";
const FADED_OPACITY = 0.25; // matches the Visx card's fadedOpacity={0.25}

type Candle = {
  d: OHLC;
  centerX: number;
  bodyLeft: number;
  bodyTop: number;
  bodyHeight: number;
  candleWidth: number;
  wickLeft: number;
  wickTop: number;
  wickHeight: number;
  fill: string;
};

export function RawD3Candlestick() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const hasAnimatedRef = useRef(false);
  const [width, setWidth] = useState(0);

  // React owns the container; measure it and feed the width to d3.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Seed the width synchronously: getBoundingClientRect forces layout and
    // returns the real width immediately, so the first draw doesn't wait on an
    // async ResizeObserver callback (delivery is tied to the rendering pipeline,
    // which a backgrounded tab can defer). The observer then handles resizes.
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

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const container = d3.select(containerRef.current);
    container.selectAll(".rawd3-tooltip").remove();

    const root = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    // one slot per candle; xScale is padded by half a slot on each side so the
    // first/last candles aren't clipped (mirrors the Visx slotWidth/2 padding).
    const slotWidth = innerW / ohlcData.length;
    const pad = slotWidth / 2;
    const x = d3
      .scaleTime()
      .domain(d3.extent(ohlcData, (d) => d.date) as [Date, Date])
      .range([pad, innerW - pad]);

    const minLow = d3.min(ohlcData, (d) => d.low) ?? 0;
    const maxHigh = d3.max(ohlcData, (d) => d.high) ?? 100;
    const yPad = (maxHigh - minLow) * 0.05 || 1;
    const y = d3
      .scaleLinear()
      .domain([minLow - yPad, maxHigh + yPad])
      .range([innerH, 0])
      .nice();

    const candleWidth = slotWidth * (1 - CANDLE_GAP);

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
      .call(d3.axisLeft(y).ticks(4).tickFormat(d3.format("~f")).tickSize(0).tickPadding(8));
    yAxis.select(".domain").remove();
    yAxis
      .selectAll("text")
      .attr("fill", "var(--chart-axis, #94a3b8)")
      .attr("font-size", 11);

    // precompute per-candle geometry (body open->close, wick high->low)
    const candles: Candle[] = ohlcData.map((d) => {
      const centerX = x(d.date);
      const yOpen = y(d.open);
      const yClose = y(d.close);
      const yHigh = y(d.high);
      const yLow = y(d.low);
      return {
        d,
        centerX,
        bodyLeft: centerX - candleWidth / 2,
        bodyTop: Math.min(yOpen, yClose),
        bodyHeight: Math.abs(yClose - yOpen) || 1, // doji -> 1px sliver
        candleWidth,
        wickLeft: centerX - WICK_WIDTH / 2,
        wickTop: Math.min(yHigh, yLow),
        wickHeight: Math.abs(yLow - yHigh) || 1,
        fill: d.close >= d.open ? POSITIVE : NEGATIVE,
      };
    });

    // one <g> per candle (wick rect + rounded body rect) so the entrance and
    // hover-dim can target the whole candle at once.
    const candleSel = root
      .append("g")
      .selectAll<SVGGElement, Candle>("g.candle")
      .data(candles)
      .join("g")
      .attr("class", "candle");

    candleSel
      .append("rect")
      .attr("x", (c) => c.wickLeft)
      .attr("y", (c) => c.wickTop)
      .attr("width", WICK_WIDTH)
      .attr("height", (c) => c.wickHeight)
      .attr("fill", (c) => c.fill);

    candleSel
      .append("rect")
      .attr("x", (c) => c.bodyLeft)
      .attr("y", (c) => c.bodyTop)
      .attr("width", candleWidth)
      .attr("height", (c) => c.bodyHeight)
      .attr("rx", 1)
      .attr("ry", 1)
      .attr("fill", (c) => c.fill)
      .attr("stroke", (c) => c.fill)
      .attr("stroke-width", 1);

    // Entrance: grow each candle vertically from its center (scaleY 0 -> 1),
    // staggered by index with a slight spring overshoot. The translate(0,cy)
    // scale(1,s) translate(0,-cy) pivot keeps the candle's center fixed while it
    // grows. Only the first real draw animates; later redraws (resize, StrictMode
    // double-mount) settle straight to the resting transform so an interrupted
    // transition can't strand a candle scaled to nothing.
    const animate = !hasAnimatedRef.current;
    if (animate) {
      const stagger = (1100 * 0.6) / candles.length;
      candleSel
        .style("opacity", 0)
        .attr("transform", (c) => {
          const cy = c.wickTop + c.wickHeight / 2;
          return `translate(0,${cy}) scale(1,0.001) translate(0,${-cy})`;
        })
        .transition()
        .delay((_c, i) => i * stagger)
        .duration(720)
        .ease(d3.easeBackOut.overshoot(1.1))
        .style("opacity", 1)
        .attr("transform", "translate(0,0) scale(1,1) translate(0,0)");
    } else {
      candleSel.attr("transform", null).style("opacity", 1);
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

    const bisectDate = d3.bisector<OHLC, Date>((d) => d.date).center;
    const fmtDate = d3.timeFormat("%b %d, %Y");
    const fmtNum = d3.format(",.2f");

    // transparent overlay drives hover by nearest-candle bisect (hovering
    // anywhere selects the closest candle, matching the Visx tooltip behavior).
    root
      .append("rect")
      .attr("width", innerW)
      .attr("height", innerH)
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mousemove", (event: MouseEvent) => {
        const [mx] = d3.pointer(event);
        const i = bisectDate(ohlcData, x.invert(mx));
        const c = candles[i];
        if (!c) return;

        candleSel.style("opacity", (_c, idx) => (idx === i ? 1 : FADED_OPACITY));

        const rows = (
          [
            ["Open", c.d.open],
            ["High", c.d.high],
            ["Low", c.d.low],
            ["Close", c.d.close],
          ] as const
        )
          .map(
            ([label, val]) =>
              `<div style="display:flex;align-items:center;gap:14px;margin-top:3px;">
                 <span style="color:#64748b;">${label}</span>
                 <span style="margin-left:auto;font-weight:600;">${fmtNum(val)}</span>
               </div>`
          )
          .join("");

        tooltip
          .html(`<div style="font-weight:600;">${fmtDate(c.d.date)}</div>${rows}`)
          .style("left", `${c.centerX + MARGIN.left}px`)
          .style("top", `${y(c.d.high) + MARGIN.top}px`)
          .style("opacity", "1");
      })
      .on("mouseleave", () => {
        candleSel.style("opacity", 1);
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
