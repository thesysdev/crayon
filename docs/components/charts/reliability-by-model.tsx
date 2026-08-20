"use client";

import {
  COST_MODELS,
  FORMATS,
  FORMAT_ORDER,
  type FormatId,
  MODELS,
  type ModelId,
  completionByModel,
  costPerPass,
  formatLabel,
} from "@/lib/benchmark-data";
import { useEffect, useRef, useState } from "react";
import { BRAND_MARKS, markViewBox } from "./brand-marks";
import { Chart, Mark, styles as s } from "./primitives";

/* The hero chart: a cost-versus-reliability frontier, one line per format.
   Cost runs right-to-left toward $0 (the CursorBench convention), so the best
   place on the chart is the top right: reliable and cheap. Each point is one
   of the five models with public pricing. */
const H = 440;
const PAD = { top: 56, bottom: 64 };
const PH = H - PAD.top - PAD.bottom;

/* chart-local palette (see .frontier in viz.module.css): this is the one
   chart where all three formats get a real colour */
const hue: Record<FormatId, string> = {
  openui: "var(--pO)",
  /* the competitors keep the same two greys they wear in the bar charts */
  a2ui: "var(--c2)",
  jsonRender: "var(--c3)",
};

const MODEL_NAME: Record<ModelId, string> = {
  sol: "GPT-5.6 Sol",
  opus: "Claude Opus 4.8",
  kimi: "Kimi K3",
  gemini: "Gemini 3.6 Flash",
  qwen: "Qwen3.8 2.4T",
  muse: "Muse Spark 1.2",
};

const C_MAX = 6.2;
const Y_MIN = 66;
const X_TICKS = [6, 4, 2, 0];
const Y_TICKS = [70, 80, 90, 100];

export function ReliabilityByModel({
  models,
  formats,
}: {
  models?: readonly ModelId[];
  formats?: readonly FormatId[];
}) {
  const holder = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(1080);
  const [hover, setHover] = useState<{ m: ModelId; f: FormatId } | null>(null);

  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setW(Math.max(320, Math.round(entry.contentRect.width)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const activeFormats = FORMAT_ORDER.filter((f) => (formats ?? FORMAT_ORDER).includes(f));
  const pricedModels = COST_MODELS.filter((m) => (models ?? MODELS.map((x) => x.id)).includes(m));

  const narrow = W < 560;
  /* narrow screens keep the plot flush with the section edges */
  const PL = narrow ? 44 : 56;
  const PR = narrow ? 12 : 40;
  const PW = W - PL - PR;
  /* reversed: expensive on the left, $0 on the right */
  const x = (cost: number) => PL + ((C_MAX - cost) / C_MAX) * PW;
  const y = (v: number) => PAD.top + (1 - (v - Y_MIN) / (100 - Y_MIN)) * PH;

  if (pricedModels.length === 0) return null;

  /* one line per format: its five priced points, dearest first */
  const series = activeFormats.map((f) => ({
    f,
    pts: pricedModels
      .map((m) => ({ m, cost: costPerPass[m]![f], score: completionByModel[m][f] }))
      .sort((a, b) => b.cost - a.cost),
  }));

  const hovered = hover
    ? { cost: costPerPass[hover.m]![hover.f], score: completionByModel[hover.m][hover.f] }
    : null;

  return (
    <Chart
      title="Reliability vs cost"
      sub="One line per format across the five models with public pricing. Up and to the right is better: more screens correct, less money."
    >
      <div ref={holder} className={`${s.svgHolder} ${s.frontier}`} style={{ position: "relative" }}>
        <svg
          className={s.svg}
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Cost versus reliability, one line per format; OpenUI sits highest and furthest toward zero cost"
        >
          {Y_TICKS.map((t) => (
            <g key={t}>
              <line x1={PL} x2={PL + PW} y1={y(t)} y2={y(t)} stroke="var(--rule)" />
              {t !== 100 ? (
                <text
                  x={PL - 12}
                  y={y(t) + 4}
                  textAnchor="end"
                  fontSize="13"
                  fill="var(--ink-muted)"
                >
                  {t}%
                </text>
              ) : null}
            </g>
          ))}

          {X_TICKS.map((t) => (
            <line
              key={`gx-${t}`}
              x1={x(t)}
              x2={x(t)}
              y1={y(100)}
              y2={PAD.top + PH}
              stroke="var(--rule)"
            />
          ))}

          {/* the chart header, set on the top axis line like the reference */}
          <text x={PL - 12} y={y(100) - 14} textAnchor="end" fontSize="13" fill="var(--ink-muted)">
            100%
          </text>
          <text x={PL + 4} y={y(100) - 14} fontSize="14" fill="var(--ink)">
            Reliability vs cost
          </text>

          {X_TICKS.map((t) => (
            <text
              key={t}
              x={x(t)}
              y={PAD.top + PH + 28}
              textAnchor="middle"
              fontSize="13"
              fill="var(--ink-muted)"
            >
              ${t}
            </text>
          ))}
          <text
            x={PL + PW / 2}
            y={PAD.top + PH + 52}
            textAnchor="middle"
            fontSize="13"
            fill="var(--ink-muted)"
          >
            Cost of one benchmark pass, 46 screens
          </text>
          <text x={PL + PW} y={y(100) - 14} textAnchor="end" fontSize="13" fill="var(--ink)">
            better ↗
          </text>

          {/* draw ours last so the purple line sits on top */}
          {[...series].reverse().map(({ f, pts }) => {
            const stroke = hue[f];
            const ours = f === "openui";
            const first = pts[0];
            return (
              <g key={f}>
                <polyline
                  className={s.line}
                  pathLength={1}
                  points={pts.map((p) => `${x(p.cost)},${y(p.score)}`).join(" ")}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={ours ? 4.5 : 2.75}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  style={{ "--d": `${activeFormats.indexOf(f) * 120}ms` } as React.CSSProperties}
                />
                {pts.map((p, i) => {
                  const isHover = hover?.m === p.m && hover?.f === f;
                  const r = 5 + (isHover ? 1.5 : 0);
                  return (
                    <rect
                      key={p.m}
                      className={s.pt}
                      x={x(p.cost) - r}
                      y={y(p.score) - r}
                      width={r * 2}
                      height={r * 2}
                      fill={ours ? "var(--surface)" : stroke}
                      stroke={stroke}
                      strokeWidth={ours ? 2.5 : 0}
                      style={
                        { cursor: "default", "--d": `${350 + i * 45}ms` } as React.CSSProperties
                      }
                      onMouseEnter={() => setHover({ m: p.m, f })}
                      onMouseLeave={() => setHover(null)}
                    />
                  );
                })}
                {narrow ? null : ours ? (
                  (() => {
                    /* ours gets a filled tag so the winning line reads first */
                    const label = formatLabel(f);
                    const tagW = 18 + label.length * 8.2;
                    const tx = x(first.cost) - 16;
                    return (
                      <g className={s.fadeLate}>
                        <rect
                          x={tx - tagW}
                          y={y(first.score) - 12}
                          width={tagW}
                          height={24}
                          fill="var(--pO)"
                        />
                        <text
                          x={tx - tagW / 2}
                          y={y(first.score) + 4.5}
                          textAnchor="middle"
                          fontSize="13.5"
                          fontWeight="700"
                          fill="#fff"
                        >
                          {label}
                        </text>
                      </g>
                    );
                  })()
                ) : (
                  <text
                    className={s.fadeLate}
                    x={x(first.cost) - 14}
                    y={y(first.score) + 5}
                    textAnchor="end"
                    fontSize="15"
                    fontWeight={600}
                    fill={stroke}
                    stroke="var(--surface)"
                    strokeWidth={4}
                    paintOrder="stroke"
                  >
                    {formatLabel(f)}
                  </text>
                )}
              </g>
            );
          })}

          {/* every point carries its model's mark; the legend below decodes them */}
          {narrow
            ? null
            : (() => {
                const glyphs = series.flatMap(({ f, pts }) =>
                  pts.map((p) => {
                    const above = y(p.score) - 30;
                    /* the chart header sits on the top gridline, so a mark that
                       would rise into it drops under its point instead */
                    const collidesWithHeader = above < PAD.top;
                    return {
                      key: `${f}-${p.m}`,
                      mark: MODELS.find((m) => m.id === p.m)!.mark,
                      lx: x(p.cost),
                      ly: f === "jsonRender" || collidesWithHeader ? y(p.score) + 12 : above,
                    };
                  }),
                );
                glyphs.sort((a, b) => a.ly - b.ly);
                for (let i = 0; i < glyphs.length; i++) {
                  for (let j = 0; j < i; j++) {
                    const a = glyphs[j];
                    const b = glyphs[i];
                    if (Math.abs(a.lx - b.lx) < 20 && Math.abs(a.ly - b.ly) < 18) b.ly = a.ly + 18;
                  }
                }
                return glyphs.map((g) => {
                  /* marks ship at different viewBox sizes; normalise to 16px */
                  const vb = Number(markViewBox(g.mark).split(" ")[2]);
                  return (
                    <path
                      key={g.key}
                      className={s.fadeLate}
                      d={BRAND_MARKS[g.mark]}
                      transform={`translate(${g.lx - 8}, ${g.ly}) scale(${16 / vb})`}
                      fill="var(--ink-muted)"
                    />
                  );
                });
              })()}
        </svg>

        {hover && hovered ? (
          <div
            className={s.hoverCard}
            style={{
              left: Math.min(Math.max(x(hovered.cost), 130), W - 130),
              top: y(hovered.score) - 14,
            }}
          >
            <strong>
              {formatLabel(hover.f)} · {MODEL_NAME[hover.m]}
            </strong>
            {hovered.score.toFixed(1)}% of screens correct · ${hovered.cost.toFixed(2)} per pass
          </div>
        ) : null}
      </div>

      {narrow ? (
        <div className={`${s.legend} ${s.legendCenter} ${s.frontier}`}>
          {FORMATS.filter((f) => activeFormats.includes(f.id)).map((f) => (
            <span key={f.id} className={s.key}>
              <span className={s.dot} style={{ background: hue[f.id] }} aria-hidden />
              {f.label}
            </span>
          ))}
        </div>
      ) : (
        <div className={`${s.legend} ${s.legendCenter}`} aria-label="Model key">
          {MODELS.filter((m) => pricedModels.includes(m.id)).map((m) => (
            <span key={m.id} className={s.key}>
              <Mark id={m.mark} />
              {MODEL_NAME[m.id]}
            </span>
          ))}
        </div>
      )}
    </Chart>
  );
}
