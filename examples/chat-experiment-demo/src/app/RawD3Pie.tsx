"use client";

// Reference implementation: the Pie / Donut chart drawn with RAW d3 (d3-selection
// + d3-transition + d3-shape arc/pie owning the SVG via a ref) instead of
// Visx/Motion rendering. Mirrors the Visx Pie card: a donut (innerRadius 70,
// size 240) whose slices sweep in one-by-one (endAngle 0 -> full, staggered),
// a hover that pops the hovered slice outward along its radial axis with a glow
// and dims the others, and an HTML center that shows the total normally and the
// hovered slice's value/label on hover (NumberFlow-style rolling number).

import * as d3 from "d3";
import { useEffect, useRef } from "react";

import { pieData } from "./sample-data";

type Datum = (typeof pieData)[number];
type Arc = d3.PieArcDatum<Datum>;

const SIZE = 240;
const INNER_RADIUS = 70;
const HOVER_OFFSET = 10; // matches PieChart's DEFAULT_HOVER_OFFSET
const CENTER = SIZE / 2;
const OUTER_RADIUS = CENTER - HOVER_OFFSET; // padding leaves room for the pop-out
const FADED_OPACITY = 0.4;

// Resolve a `var(--x)` color string to a concrete value (SVG filters/gradients
// don't reliably pick up CSS vars; concrete colors make the glow dependable).
function resolveColor(cs: CSSStyleDeclaration, raw: string, fallback: string) {
  const m = /var\((--[\w-]+)\)/.exec(raw);
  if (m) return cs.getPropertyValue(m[1]).trim() || fallback;
  return raw || fallback;
}

const PALETTE_FALLBACK = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6"];

export function RawD3Pie() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const idRef = useRef("rawd3-pie-" + Math.random().toString(36).slice(2, 9));
  const hasAnimatedRef = useRef(false);

  // d3 owns everything inside the <svg> ref + the HTML center overlay. Size is
  // fixed (240), so no ResizeObserver is needed — this mirrors PieChart's
  // fixed-size branch (size={240}), which skips ParentSize entirely.
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const cs = getComputedStyle(containerRef.current);
    const total = pieData.reduce((sum, d) => sum + d.value, 0);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const container = d3.select(containerRef.current);
    container.selectAll(".rawd3-pie-center").remove();

    const root = svg
      .append("g")
      .attr("transform", `translate(${CENTER},${CENTER})`);

    // d3-shape pie + arc. startAngle -PI/2 (top), full sweep clockwise, no pad,
    // sort(null) keeps data order — identical to the Visx pie generator config.
    const pieGen = d3
      .pie<Datum>()
      .value((d) => d.value)
      .startAngle(-Math.PI / 2)
      .endAngle((3 * Math.PI) / 2)
      .padAngle(0)
      .sort(null);

    const arcGen = d3
      .arc<Arc>()
      .innerRadius(INNER_RADIUS)
      .outerRadius(OUTER_RADIUS)
      .cornerRadius(0);

    const arcs = pieGen(pieData);

    const colorOf = (i: number) =>
      resolveColor(cs, pieData[i].color ?? "", PALETTE_FALLBACK[i % PALETTE_FALLBACK.length]);

    // Pop-out direction along the slice's radial axis. d3 arc has 0 at 12 o'clock
    // and angles increase clockwise, so outward is (sin, -cos) of the mid-angle.
    const offsetOf = (a: Arc) => {
      const mid = (a.startAngle + a.endAngle) / 2;
      return { x: Math.sin(mid) * HOVER_OFFSET, y: -Math.cos(mid) * HOVER_OFFSET };
    };

    // One <g> per slice: a static transparent hitbox (handles hover, never moves
    // so the cursor can't "fall off" a popped-out slice) + a visible path that
    // does the sweep entrance, the pop-out translate, the dim, and the glow.
    const sliceG = root
      .selectAll<SVGGElement, Arc>("g.slice")
      .data(arcs)
      .join("g")
      .attr("class", "slice")
      .style("cursor", "pointer");

    sliceG
      .append("path")
      .attr("class", "hitbox")
      .attr("d", (a) => arcGen(a))
      .attr("fill", "transparent");

    const visible = sliceG
      .append("path")
      .attr("class", "visible")
      .attr("fill", (_a, i) => colorOf(i))
      .style("pointer-events", "none")
      // CSS transitions (not d3/rAF) drive the hover pop-out + dim + glow, so the
      // target values land in the inline style synchronously and the motion still
      // reads as a spring. The transform overshoot curve mimics Motion's spring.
      .style(
        "transition",
        "opacity 0.15s ease, transform 0.25s cubic-bezier(0.34,1.56,0.64,1), filter 0.15s ease"
      );

    // Entrance: sweep each slice from a zero arc to full, staggered by index.
    // Only the first real draw animates; later redraws (StrictMode double-mount)
    // bake the full arc so an interrupted sweep can't strand a slice invisible.
    if (!hasAnimatedRef.current) {
      visible
        .attr("d", (a) => arcGen({ ...a, endAngle: a.startAngle }))
        .transition()
        .delay((_a, i) => (0.1 + i * 0.08) * 1000)
        .duration(700)
        .ease(d3.easeCubicOut)
        .attrTween("d", (a) => {
          const i = d3.interpolate(a.startAngle, a.endAngle);
          return (t) => arcGen({ ...a, endAngle: i(t) }) ?? "";
        });
    } else {
      visible.attr("d", (a) => arcGen(a));
    }
    hasAnimatedRef.current = true;

    // HTML center overlay (donut hole): total + label normally, hovered slice on
    // hover. Rendered as plain HTML stacked over the SVG (matches PieCenter,
    // which avoids foreignObject). pointer-events none so it never eats hovers.
    const fg = resolveColor(cs, "var(--chart-foreground)", "#0f172a");
    const centerSize = INNER_RADIUS * 2 - 16;
    const center = container
      .append("div")
      .attr("class", "rawd3-pie-center")
      .style("position", "absolute")
      .style("left", "50%")
      .style("top", "50%")
      .style("width", `${centerSize}px`)
      .style("height", `${centerSize}px`)
      .style("transform", "translate(-50%, -50%)")
      .style("display", "flex")
      .style("flex-direction", "column")
      .style("align-items", "center")
      .style("justify-content", "center")
      .style("text-align", "center")
      .style("pointer-events", "none");

    const valueSel = center
      .append("span")
      .style("font-size", "30px")
      .style("font-weight", "700")
      .style("line-height", "1")
      .style("color", fg)
      .style("font-variant-numeric", "tabular-nums");

    const labelSel = center
      .append("span")
      .style("margin-top", "6px")
      .style("font-size", "13px")
      .style("color", "#64748b");

    const fmtNum = d3.format(",");

    // Seed the center synchronously (no transition) so it shows the total even in
    // a backgrounded tab where rAF — and thus d3 transitions — are paused.
    const valueNode = valueSel.node() as SVGSpanElement & { __v?: number };
    valueNode.__v = total;
    valueSel.text(fmtNum(total)).attr("data-target", total);
    labelSel.text("Total");

    // NumberFlow-style roll: tween the displayed number from its current value to
    // the target. data-target carries the intended value for freeze-proof reads.
    const rollTo = (target: number) => {
      const start = valueNode.__v ?? total;
      valueNode.__v = target;
      valueSel
        .attr("data-target", target)
        .transition()
        .duration(450)
        .ease(d3.easeCubicOut)
        .tween("text", function () {
          const i = d3.interpolateNumber(start, target);
          return (t) => {
            (this as SVGSpanElement).textContent = fmtNum(Math.round(i(t)));
          };
        });
    };

    sliceG
      .select<SVGPathElement>(".hitbox")
      .on("mouseenter", (_event, a) => {
        const i = a.index;
        const off = offsetOf(a);
        visible
          .style("opacity", (_d, idx) => (idx === i ? 1 : FADED_OPACITY))
          .style("transform", (_d, idx) =>
            idx === i ? `translate(${off.x}px,${off.y}px)` : "translate(0px,0px)"
          )
          .style("filter", (_d, idx) =>
            idx === i ? `drop-shadow(0 0 12px ${colorOf(i)})` : "none"
          );
        rollTo(a.data.value);
        labelSel.text(a.data.label);
      })
      .on("mouseleave", () => {
        visible
          .style("opacity", 1)
          .style("transform", "translate(0px,0px)")
          .style("filter", "none");
        rollTo(total);
        labelSel.text("Total");
      });

    return () => {
      container.selectAll(".rawd3-pie-center").remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: SIZE, height: SIZE }}
    >
      <svg height={SIZE} ref={svgRef} width={SIZE} />
    </div>
  );
}
