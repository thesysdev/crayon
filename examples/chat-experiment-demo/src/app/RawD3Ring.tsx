"use client";

// Reference implementation: the Ring (concentric progress) chart drawn with RAW
// d3 (d3-selection + d3-transition + d3-shape arc owning the SVG via a ref)
// instead of Visx/Motion rendering. Mirrors the Visx Ring card: three concentric
// round-capped progress arcs (size 240, stroke 12, gap 6, innermost inner radius
// 60), each over a faint full-circle track, sweeping in from -PI/2; an HTML
// center showing the total ("Total Sessions") or the hovered ring's value; and a
// hover that scales the hovered ring up + glows it, nudges the outer rings out,
// dims the rest, and rolls the center number to the hovered ring's value.

import * as d3 from "d3";
import { useEffect, useRef } from "react";

import { ringData } from "./sample-data";

const SIZE = 240;
const CENTER = SIZE / 2;
const STROKE = 12;
const GAP = 6;
const BASE_INNER = 60;
const START_ANGLE = -Math.PI / 2;
const ARC_RANGE = 2 * Math.PI; // endAngle 3*PI/2 - startAngle -PI/2
const CORNER = STROKE / 2; // round caps
const HOVER_SCALE = 1.03;
const PUSH_SCALE = 1.02; // outer rings when an inner ring is hovered

function resolveColor(cs: CSSStyleDeclaration, raw: string, fallback: string) {
  const m = /var\((--[\w-]+)\)/.exec(raw);
  if (m) return cs.getPropertyValue(m[1]).trim() || fallback;
  return raw || fallback;
}

const PALETTE_FALLBACK = ["#5b8def", "#22c55e", "#f59e0b", "#ef4444", "#a855f7"];

type RingDatum = {
  index: number;
  label: string;
  value: number;
  inner: number;
  outer: number;
  color: string;
  targetEnd: number;
};

export function RawD3Ring() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const hasAnimatedRef = useRef(false);

  // Fixed size (240), so no ResizeObserver — mirrors RingChart's fixed-size
  // branch (size={240}), which skips ParentSize. d3 owns the <svg> + center div.
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const cs = getComputedStyle(containerRef.current);
    const total = ringData.reduce((sum, d) => sum + d.value, 0);
    const track = resolveColor(cs, "var(--chart-ring-background)", "#e8edf3");
    const fg = resolveColor(cs, "var(--chart-foreground)", "#0f172a");

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const container = d3.select(containerRef.current);
    container.selectAll(".rawd3-ring-center").remove();

    const arcGen = d3.arc<{ inner: number; outer: number; startAngle: number; endAngle: number }>()
      .innerRadius((d) => d.inner)
      .outerRadius((d) => d.outer)
      .startAngle((d) => d.startAngle)
      .endAngle((d) => d.endAngle)
      .cornerRadius(CORNER)
      .padAngle(0);

    const rings: RingDatum[] = ringData.map((d, i) => {
      const inner = BASE_INNER + i * (STROKE + GAP);
      return {
        index: i,
        label: d.label,
        value: d.value,
        inner,
        outer: inner + STROKE,
        color: resolveColor(cs, d.color ?? "", PALETTE_FALLBACK[i % PALETTE_FALLBACK.length]),
        targetEnd: START_ANGLE + ARC_RANGE * (d.value / d.maxValue),
      };
    });

    const fullArc = (r: RingDatum, endAngle: number) =>
      arcGen({ inner: r.inner, outer: r.outer, startAngle: START_ANGLE, endAngle }) ?? "";

    // One <g> per ring. The group carries position + hover scale via a CSS
    // transform; transform-box:view-box + transform-origin:0 0 means the scale
    // pivots about the SVG origin, so `translate(C,C) scale(s)` scales each ring
    // about the shared chart center (its arcs are generated around 0,0).
    const ringG = svg
      .selectAll<SVGGElement, RingDatum>("g.ring")
      .data(rings)
      .join("g")
      .attr("class", "ring")
      .style("cursor", "pointer")
      .style("transform-box", "view-box")
      .style("transform-origin", "0px 0px")
      .style("transform", `translate(${CENTER}px,${CENTER}px) scale(1)`)
      .style("transition", "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)");

    // faint full-circle track behind each progress arc
    ringG
      .append("path")
      .attr("class", "track")
      .attr("d", (r) => fullArc(r, START_ANGLE + ARC_RANGE))
      .attr("fill", track)
      .style("transition", "opacity 0.15s ease");

    const progress = ringG
      .append("path")
      .attr("class", "progress")
      .attr("fill", (r) => r.color)
      .style("transition", "opacity 0.15s ease, filter 0.15s ease");

    // Entrance: sweep each progress arc from empty to its target, staggered after
    // the rings settle. Only the first real draw animates; later redraws
    // (StrictMode double-mount) bake the full arc so an interrupted sweep can't
    // strand a ring empty.
    if (!hasAnimatedRef.current) {
      progress
        .attr("d", (r) => fullArc(r, START_ANGLE))
        .transition()
        .delay((_r, i) => (0.6 + i * 0.1) * 1000)
        .duration(900)
        .ease(d3.easeCubicOut)
        .attrTween("d", (r) => {
          const interp = d3.interpolate(START_ANGLE, r.targetEnd);
          return (t) => fullArc(r, interp(t));
        });
    } else {
      progress.attr("d", (r) => fullArc(r, r.targetEnd));
    }
    hasAnimatedRef.current = true;

    // HTML center overlay (total normally, hovered ring on hover).
    const centerSize = BASE_INNER * 2 - 16;
    const center = container
      .append("div")
      .attr("class", "rawd3-ring-center")
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
      .style("font-size", "28px")
      .style("font-weight", "700")
      .style("line-height", "1")
      .style("color", fg)
      .style("font-variant-numeric", "tabular-nums");

    const labelSel = center
      .append("span")
      .style("margin-top", "6px")
      .style("font-size", "12px")
      .style("color", "#64748b");

    const fmtNum = d3.format(",");
    const valueNode = valueSel.node() as SVGSpanElement & { __v?: number };
    valueNode.__v = total;
    valueSel.text(fmtNum(total)).attr("data-target", total);
    labelSel.text("Total Sessions");

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

    // Hover via CSS-transition style sets (not rAF), so the target values land in
    // the inline style synchronously and stay verifiable in a backgrounded tab.
    const applyHover = (h: number | null) => {
      ringG.each(function (r) {
        const g = d3.select(this);
        const scale = h === r.index ? HOVER_SCALE : h !== null && h < r.index ? PUSH_SCALE : 1;
        g.style("transform", `translate(${CENTER}px,${CENTER}px) scale(${scale})`);
        const faded = h !== null && h !== r.index;
        g.select(".track").style("opacity", faded ? 0.3 : 1);
        g.select(".progress")
          .style("opacity", faded ? 0.4 : 1)
          .style("filter", h === r.index ? `drop-shadow(0 0 12px ${r.color})` : "none");
      });
      if (h === null) {
        rollTo(total);
        labelSel.text("Total Sessions");
      } else {
        rollTo(ringData[h].value);
        labelSel.text(ringData[h].label);
      }
    };

    ringG
      .on("mouseenter", (_event, r) => applyHover(r.index))
      .on("mouseleave", () => applyHover(null));

    return () => {
      container.selectAll(".rawd3-ring-center").remove();
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
