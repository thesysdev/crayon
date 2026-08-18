"use client";

import { useEffect, useRef, useState } from "react";
import {
  BRIEFS,
  FORMATS,
  FORMAT_ORDER,
  type FormatId,
  MODELS,
  completionByDensity,
  formatLabel,
} from "@/lib/benchmark-data";
import { Chart, slotClass, styles as s } from "./primitives";

/* Drawn at the container's real pixel width — the SVG never scales, so text
   is always its true size and the plot always fills the card. */
const H = 300;
const PAD = { top: 14, right: 54, bottom: 48, left: 34 };
const PH = H - PAD.top - PAD.bottom;
const LAST = completionByDensity.length - 1;
const finalValue = (id: FormatId) => completionByDensity[LAST][id];

const hue = { 1: "var(--c1)", 2: "var(--c2)", 3: "var(--c3)" } as const;

export function CompletionByDensity() {
  const holder = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(712);

  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setW(Math.max(320, Math.round(entry.contentRect.width)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const PW = W - PAD.left - PAD.right;
  const x = (i: number) => PAD.left + (i / LAST) * PW;
  const y = (v: number) => PAD.top + (1 - v / 100) * PH;

  /* square line-end tags, 20px tall; nudged apart when lines finish close */
  const placed = FORMAT_ORDER.map((id) => ({ id, ty: y(finalValue(id)) })).sort((a, b) => a.ty - b.ty);
  for (let i = 1; i < placed.length; i++) {
    if (placed[i].ty - placed[i - 1].ty < 22) placed[i].ty = placed[i - 1].ty + 22;
  }
  const tagY = Object.fromEntries(placed.map((p) => [p.id, p.ty])) as Record<FormatId, number>;

  return (
    <Chart
      title="Completion rate by screen complexity"
      sub="The more a brief asks for, the less any format delivers. Ours declines most gently, and still gives up 21 points by the time a screen carries twenty requirements."
      note={
        <>
          {BRIEFS} briefs in 5 bands (~9 each), averaged over {MODELS.length} models.
          Per-band counts are unpublished, so no error bars — read the slope, not the
          points.
        </>
      }
    >
      <div ref={holder}>
      <svg
        className={s.svg}
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Completion falls for all three formats as briefs ask for more"
      >
        {[0, 25, 50, 75, 100].map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={PAD.left + PW} y1={y(t)} y2={y(t)} stroke="var(--rule)" />
            <text x={PAD.left - 10} y={y(t) + 4} textAnchor="end" fontSize="13" fill="var(--ink-muted)">
              {t}
            </text>
          </g>
        ))}

        {FORMAT_ORDER.map((id) => {
          const slot = FORMATS.find((f) => f.id === id)!.series;
          const stroke = hue[slot];
          const pts = completionByDensity.map((r, i) => `${x(i)},${y(r[id])}`).join(" ");
          const label = `${finalValue(id).toFixed(0)}%`;
          const tagW = 12 + label.length * 8;
          return (
            <g key={id}>
              <polyline
                points={pts}
                fill="none"
                stroke={stroke}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <rect x={x(LAST) + 8} y={tagY[id] - 10} width={tagW} height={20} fill={stroke} />
              <text
                x={x(LAST) + 8 + tagW / 2}
                y={tagY[id] + 4.5}
                textAnchor="middle"
                className={s.endTag}
                fill="#fff"
              >
                {label}
              </text>
            </g>
          );
        })}

        {completionByDensity.map((r, i) => (
          <text key={r.band} x={x(i)} y={PAD.top + PH + 26} textAnchor="middle" fontSize="13" fill="var(--ink-muted)">
            {r.band}
          </text>
        ))}
        <text x={PAD.left} y={PAD.top + PH + 46} fontSize="13" fill="var(--ink-muted)">
          requirements per screen
        </text>
      </svg>
      </div>

      <div className={s.legend}>
        {FORMATS.map((f) => (
          <span key={f.id} className={`${s.key} ${slotClass(f.series)}`}>
            <span className={s.dot} aria-hidden />
            {f.label}:&nbsp;<span className={s.legendVal}>{finalValue(f.id).toFixed(0)}%</span>
          </span>
        ))}
      </div>
    </Chart>
  );
}
