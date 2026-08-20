"use client";

import { production, repairFunnel } from "@/lib/benchmark-data";
import { useEffect, useRef, useState } from "react";
import { Chart, styles as s } from "./primitives";

/* Production repair as a step funnel: every stage shows how many screens are
   still broken, and the caption under each step says what fixed the rest.
   Page-only; the blog keeps the original segmented bar. */
const H = 260;
const TRANSITION = 110;

export function RepairFunnelFlow() {
  const holder = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(1080);

  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setW(Math.max(320, Math.round(entry.contentRect.width)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* The upstream record is a set of rates, so the funnel is drawn in shares of
     first-pass validation failures rather than invented per-screen counts. */
  const stages = repairFunnel.stages.map((st) => ({
    value: st.share,
    label: st.label,
    sub: st.note,
    display: `${st.share}%`,
    tip:
      st.id === "failed"
        ? `About ${production.triggerRate}% of streaming generations trip validation on the first pass`
        : `The sanitizer recovers ${production.repairedShare}% of them; under 1% of all streaming screens reach a user broken`,
  }));

  const colW = W / stages.length;
  const baseY = H - 8;
  const h = (v: number) => Math.max((v / 100) * (H - 40), 6);
  const y = (v: number) => baseY - h(v);
  const fills = [
    "color-mix(in srgb, var(--c1) 88%, var(--surface))",
    "color-mix(in srgb, var(--c1) 30%, var(--surface))",
  ];

  return (
    <Chart
      title="Repair funnel"
      sub="What happens to a broken generation before it can reach a user."
    >
      <div ref={holder} className={s.funnelWrap}>
        <svg
          className={s.svg}
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`About ${production.triggerRate}% of streaming generations fail validation on the first pass; the sanitizer repairs ${production.repairedShare}% of those, leaving ${100 - production.repairedShare}% still broken`}
        >
          {stages.map((st, i) => {
            const x0 = i * colW;
            const x1 = (i + 1) * colW;
            const yTop = y(st.value);
            const next = stages[i + 1];
            const yNext = next ? y(next.value) : yTop;
            const t = next ? Math.min(TRANSITION, colW * 0.5) : 0;
            const path = next
              ? `M ${x0} ${baseY} L ${x0} ${yTop} L ${x1 - t} ${yTop} ` +
                `C ${x1 - t * 0.45} ${yTop} ${x1 - t * 0.55} ${yNext} ${x1} ${yNext} ` +
                `L ${x1} ${baseY} Z`
              : `M ${x0} ${baseY} L ${x0} ${yTop} L ${x1} ${yTop} L ${x1} ${baseY} Z`;
            return (
              <g key={st.label}>
                <path
                  className={s.fadeLate}
                  d={path}
                  fill={fills[i]}
                  style={{ "--d": `${i * 140}ms` } as React.CSSProperties}
                />
                {i > 0 ? (
                  <line x1={x0} x2={x0} y1={12} y2={baseY} stroke="var(--rule)" strokeWidth="1" />
                ) : null}
              </g>
            );
          })}
          <line x1={0} x2={W} y1={baseY} y2={baseY} stroke="var(--rule)" strokeWidth="1" />
        </svg>

        {/* percent pills, floated over each stage */}
        {stages.map((st, i) => {
          const cy = Math.min(baseY - h(st.value) / 2, baseY - 24);
          return (
            <span
              key={st.label}
              className={`${s.funnelPill} ${s.fadeLate}`}
              style={
                {
                  left: `${((i + 0.5) / stages.length) * 100}%`,
                  top: cy,
                  "--d": `${200 + i * 140}ms`,
                } as React.CSSProperties
              }
            >
              {st.display}
            </span>
          );
        })}
      </div>

      <div className={s.funnelFeet}>
        {stages.map((st, i) => (
          <div key={st.label} className={`${s.funnelFoot} ${s.tip}`} data-tip={st.tip}>
            <span className={s.funnelFootHead}>
              <strong>{st.display}</strong>
              <span className={s.funnelFootLabel}>{st.label}</span>
            </span>
            <span className={s.funnelFootSub}>{st.sub}</span>
          </div>
        ))}
      </div>
    </Chart>
  );
}
