"use client";

import {
  COST_MODELS,
  FORMATS,
  FORMAT_ORDER,
  MODELS,
  OPENUI_MODEL_BOARD,
  completionByModel,
  costPerPass,
  formatLabel,
  modelBoardCostPerTask,
  modelBoardDefaultSelected,
  modelBoardFamilyFor,
  modelBoardFrontier,
  type FormatId,
  type ModelBoardProvider,
  type ModelId,
} from "@/lib/benchmark-data";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { BRAND_COLORS, BRAND_MARKS, GEMINI_GRADIENT, markViewBox } from "./brand-marks";
import { Chart, ChartDataDisclosure, Mark, styles as s } from "./primitives";

/* Both tabs share a plot box so switching views does not resize the hero.
   PH is derived from the board's plot height for the same reason. */
const PAD = { top: 44, bottom: 68 };
const FORMAT_PLOT_HEIGHT = 720;
const H = FORMAT_PLOT_HEIGHT + PAD.top + PAD.bottom;
const PH = FORMAT_PLOT_HEIGHT;
type View = "board" | "formats";

const FORMAT_HUE: Record<FormatId, string> = {
  openui: "var(--pO)",
  a2ui: "var(--c2)",
  jsonRender: "var(--c3)",
};
const PROVIDER_HUE: Record<ModelBoardProvider, string> = {
  xAI: "#5f6470",
  OpenAI: "#0f9f79",
  Anthropic: "#d26a3a",
  Google: "#3978e6",
  Moonshot: "#7655d6",
  Meta: "#6059cf",
  Alibaba: "#b88308",
  Zhipu: "#0d9488",
  DeepSeek: "#0891b2",
  "Thinking Machines": "#c34a91",
  Microsoft: "#2774c8",
  Mistral: "#dc5a4f",
  IBM: "#4d6fb8",
  Liquid: "#c04f79",
  InclusionAI: "#7c6f64",
};
const MODEL_NAME: Record<ModelId, string> = {
  sol: "GPT-5.6 Sol",
  opus: "Claude Opus 4.8",
  kimi: "Kimi K3",
  gemini: "Gemini 3.6 Flash",
  qwen: "Qwen3.8 2.4T",
  muse: "Muse Spark 1.2",
};
const PROVIDERS = Array.from(new Set(OPENUI_MODEL_BOARD.map((p) => p.provider)));
/* The page's established geometry puts cheaper models on the right, so the
   best trade-off is consistently top-right. Log spacing keeps sub-cent API
   prices distinguishable. Free models use a tiny display floor; their exact
   zero price remains available in the tooltip. */
/* Half-decade steps (1 and 3 per decade) keep the ticks essentially evenly
   spaced on a log axis while staying round enough to read. A constant ratio is
   what makes spacing even; mixed ratios are what made the old axis lurch. */
const decadeFloor = (value: number) => 10 ** Math.floor(Math.log10(value));
const decadeCeil = (value: number) => 10 ** Math.ceil(Math.log10(value));
const boardTicksBetween = (min: number, max: number) => {
  const decades = Math.log10(max) - Math.log10(min);
  /* half-decade steps over a short span, whole decades once the axis is wide,
     so the tick count stays around five however much is selected */
  const step = decades > 2.5 ? 1 : 0.5;
  const ticks: number[] = [];
  for (let exponent = Math.log10(max); exponent >= Math.log10(min) - 1e-9; exponent -= step) {
    const value = 10 ** exponent;
    /* snap the half-decade to its round neighbour: 0.0316 reads as 0.03 */
    ticks.push(Number(value.toPrecision(1)));
  }
  return ticks;
};

/* enough decimals for the value, never a rounded-to-nothing "$0.0000" */
const boardCostLabel = (value: number) => {
  const decimals = value >= 0.01 ? 2 : value >= 0.001 ? 3 : value >= 0.0001 ? 4 : 5;
  return `$${value.toFixed(decimals)}`;
};
/* The score axis frames whatever is on screen, the same way the cost axis
   does: floor to a round value just below the lowest visible score, then pick
   a step that lands 5-6 ticks. Hiding the weak tail lifts the floor and the
   remaining models spread out instead of crowding the top. */
const boardScoreAxis = (scores: number[]) => {
  if (!scores.length) return { min: 0, ticks: [0, 20, 40, 60, 80, 100] };
  const floor = Math.max(0, Math.floor((Math.min(...scores) - 3) / 10) * 10);
  const span = 100 - floor;
  const step = span <= 10 ? 2 : span <= 20 ? 5 : span <= 50 ? 10 : 20;
  const ticks: number[] = [];
  for (let value = floor; value <= 100 + 1e-9; value += step) ticks.push(Number(value.toFixed(0)));
  return { min: floor, ticks };
};
const BOARD_REFERENCE_LABELS = [
  "gpt-5-6-sol",
  "claude-opus-4-8",
  "gemini-3-7-flash",
  "kimi-k3",
  "muse-spark-1-2",
  "diffusion-gemma-26b-a4b",
  "ling-3-tiny",
  "lfm-2-5-2-6b",
] as const;
const BOARD_PARETO = modelBoardFrontier();
const DEFAULT_BOARD_IDS = OPENUI_MODEL_BOARD.filter((point) =>
  modelBoardDefaultSelected(point.id),
).map((point) => point.id);
const DEFAULT_BOARD_ID_SET = new Set<string>(DEFAULT_BOARD_IDS);

const sameIds = (left: ReadonlySet<string>, right: ReadonlySet<string>) =>
  left.size === right.size && [...left].every((id) => right.has(id));

export function ReliabilityByModel({
  models,
  formats,
}: {
  models?: readonly ModelId[];
  formats?: readonly FormatId[];
}) {
  const holder = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1080);
  const [view, setView] = useState<View>("board");
  const [selectedBoardIds, setSelectedBoardIds] = useState<Set<string>>(
    () => new Set(DEFAULT_BOARD_IDS),
  );
  const [boardHover, setBoardHover] = useState<string | null>(null);
  const [formatHover, setFormatHover] = useState<{ m: ModelId; f: FormatId } | null>(null);
  const [urlReady, setUrlReady] = useState(false);

  useEffect(() => {
    const element = holder.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(320, Math.round(entry.contentRect.width))),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      setView(params.get("view") === "formats" ? "formats" : "board");
      const requestedModels = params.get("models");
      if (requestedModels !== null) {
        const validIds = new Set(OPENUI_MODEL_BOARD.map((point) => point.id));
        setSelectedBoardIds(
          new Set(requestedModels.split(",").filter((id) => validIds.has(id as never))),
        );
      } else {
        setSelectedBoardIds(new Set(DEFAULT_BOARD_IDS));
      }
      setUrlReady(true);
    };
    queueMicrotask(syncFromUrl);
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  useEffect(() => {
    if (!urlReady) return;
    const url = new URL(window.location.href);
    if (view === "formats") url.searchParams.set("view", "formats");
    else url.searchParams.delete("view");
    if (sameIds(selectedBoardIds, DEFAULT_BOARD_ID_SET)) url.searchParams.delete("models");
    else url.searchParams.set("models", [...selectedBoardIds].join(","));
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [selectedBoardIds, urlReady, view]);

  const narrow = width < 620;
  const boardPlotHeight = narrow ? 820 : 720;
  /* The grid stays flush with the control row (PL = 0). Axis labels sit at
     negative x and would be clipped, so the viewBox is extended left by
     GUTTER and the svg is pulled back by the same amount: x = 0 still lands
     on the container's left edge, and the labels hang into the page gutter. */
  const PL = 0;
  const PR = 0;
  const GUTTER = narrow ? 44 : 72;
  const PW = width - PL - PR;
  const boardTop = PAD.top;
  const boardBottom = boardTop + boardPlotHeight;
  const boardHeight = boardBottom + PAD.bottom;
  const visibleBoardPoints = OPENUI_MODEL_BOARD.filter((point) => selectedBoardIds.has(point.id));
  const { min: boardYMin, ticks: boardYTicks } = boardScoreAxis(
    visibleBoardPoints.map((point) => point.score),
  );
  /* The cost axis focuses on what is actually shown, so hiding the cheap tail
     spreads the remaining models out instead of leaving dead space. Free and
     self-hosted models pin to the floor tick, which is labelled $0. */
  const visiblePriced = visibleBoardPoints.filter(
    (point) => !("unpriced" in point) && modelBoardCostPerTask(point) > 0,
  );
  const visibleCosts = visiblePriced.map((point) => modelBoardCostPerTask(point));
  const hasFreeVisible = visibleBoardPoints.some(
    (point) => "unpriced" in point || modelBoardCostPerTask(point) === 0,
  );
  const boardMaxCost = visibleCosts.length ? decadeCeil(Math.max(...visibleCosts)) : 0.1;
  const pricedFloor = visibleCosts.length ? decadeFloor(Math.min(...visibleCosts)) : 0.001;
  /* a free model needs a decade of its own below the cheapest priced one */
  const boardMinCost = hasFreeVisible ? pricedFloor / 10 : pricedFloor;
  const boardXTicks = boardTicksBetween(boardMinCost, boardMaxCost);
  const boardX = (cost: number) => {
    const displayedCost = Math.max(cost || boardMinCost, boardMinCost);
    const proportion =
      (Math.log(displayedCost) - Math.log(boardMinCost)) /
      (Math.log(boardMaxCost) - Math.log(boardMinCost));
    return PL + (1 - proportion) * PW;
  };
  const boardY = (score: number) =>
    boardTop + (1 - (score - boardYMin) / (100 - boardYMin)) * boardPlotHeight;
  const formatX = (cost: number) => PL + ((9 - cost) / 9) * PW;
  const formatY = (score: number) => PAD.top + (1 - (score - 60) / 40) * PH;
  const visibleProviders = PROVIDERS.filter((provider) =>
    visibleBoardPoints.some((point) => point.provider === provider),
  );

  const pricedModels = COST_MODELS.filter((m) => (models ?? MODELS.map((x) => x.id)).includes(m));
  const activeFormats = FORMAT_ORDER.filter((f) => (formats ?? FORMAT_ORDER).includes(f));
  const formatSeries = activeFormats.map((format) => ({
    format,
    points: pricedModels
      .map((model) => ({
        model,
        cost: costPerPass[model]![format],
        score: completionByModel[model][format],
      }))
      .sort((a, b) => b.cost - a.cost),
  }));
  const hoveredBoard = OPENUI_MODEL_BOARD.find((p) => p.id === boardHover);
  const hoveredFormat = formatHover
    ? {
        cost: costPerPass[formatHover.m]![formatHover.f],
        score: completionByModel[formatHover.m][formatHover.f],
      }
    : null;

  /* Keep the default view editorial: label the competitive frontier, a few
     major reference models, and the local/free extremes. Every other model is
     still fully named in its hover/focus card and accessible label. */
  const visiblePareto = visibleBoardPoints
    .filter(
      (point) =>
        !("unpriced" in point) &&
        !visibleBoardPoints.some(
          (other) =>
            other !== point &&
            !("unpriced" in other) &&
            modelBoardCostPerTask(other) <= modelBoardCostPerTask(point) &&
            other.score >= point.score &&
            (modelBoardCostPerTask(other) < modelBoardCostPerTask(point) ||
              other.score > point.score),
        ),
    )
    .sort((a, b) => modelBoardCostPerTask(b) - modelBoardCostPerTask(a));
  const competitivePareto = visiblePareto.filter((point) => point.score >= 80);
  const competitiveParetoIds = new Set(competitivePareto.map((point) => point.id));
  /* Every visible point is named, as on the Artificial Analysis reference.
     The collision pass below shifts and re-anchors labels rather than hiding
     them, so no model is silently unlabelled. */
  const labelledBoardIds = new Set<string>(visibleBoardPoints.map((point) => point.id));
  const labelFontSize = narrow ? 10 : 11.5;
  /* Labels sit beside their dot on the same centre line, as on the Artificial
     Analysis reference. Candidates are tried nearest-first: right of the dot,
     left of it, then progressively larger vertical offsets on either side. The
     search widens until a free slot exists, so a label is never dropped on top
     of another one; anything pushed more than a few pixels off its dot gets a
     leader line so the pairing stays obvious. */
  const boardLabels = (() => {
    /* the axis tick labels occupy the gutter and the plot floor, so they are
       seeded as obstacles: a model label must not land on "100%" either */
    const placed: Array<{ left: number; right: number; top: number; bottom: number }> = [
      ...boardYTicks.map((tick) => ({
        left: PL - GUTTER,
        right: PL - 6,
        top: boardY(tick) - labelFontSize,
        bottom: boardY(tick) + 8,
      })),
      /* and every plotted dot: a label must never sit on top of a data point,
         its own or anyone else's */
      ...visibleBoardPoints.map((point) => {
        const cx = boardX(modelBoardCostPerTask(point));
        const cy = boardY(point.score);
        return { left: cx - 7, right: cx + 7, top: cy - 7, bottom: cy + 7 };
      }),
    ];
    const gap = narrow ? 9 : 11;
    const dotRadius = 4;
    const overlaps = (box: { left: number; right: number; top: number; bottom: number }) =>
      placed.some(
        (other) =>
          box.left < other.right &&
          box.right > other.left &&
          box.top < other.bottom &&
          box.bottom > other.top,
      );

    /* nearest offsets first: 0, then alternating down/up in 13px steps */
    const offsets = [0];
    for (let step = 1; step <= 26; step++) offsets.push(step * 13, -step * 13);

    return visibleBoardPoints
      .filter((point) => labelledBoardIds.has(point.id))
      .sort((a, b) => b.score - a.score || modelBoardCostPerTask(a) - modelBoardCostPerTask(b))
      .map((point) => {
        const px = boardX(modelBoardCostPerTask(point));
        const py = boardY(point.score);
        const labelWidth = Math.max(36, point.label.length * (narrow ? 5.4 : 6.35));
        /* keep labels inside the plot: hug the side with more room */
        const preferred: "start" | "end" = px < PL + PW * 0.55 ? "start" : "end";
        const sides: Array<"start" | "end"> = [preferred, preferred === "start" ? "end" : "start"];

        for (const offset of offsets) {
          for (const anchor of sides) {
            const lx = px + (anchor === "start" ? gap + dotRadius : -(gap + dotRadius));
            const left = anchor === "start" ? lx : lx - labelWidth;
            const right = anchor === "start" ? lx + labelWidth : lx;
            if (left < PL - GUTTER || right > PL + PW) continue;
            /* baseline that centres the text on the dot, then the offset */
            const ly = py + labelFontSize * 0.35 + offset;
            if (ly - labelFontSize < boardTop || ly > boardBottom) continue;
            const box = {
              left: left - 4,
              right: right + 4,
              top: ly - labelFontSize - 3,
              bottom: ly + 4,
            };
            if (overlaps(box)) continue;
            placed.push(box);
            return { point, lx, ly, anchor, offset };
          }
        }

        /* every slot in range was taken: stack below the plot floor rather than
           printing one label over another */
        const anchor = preferred;
        const lx = px + (anchor === "start" ? gap + dotRadius : -(gap + dotRadius));
        let ly = boardBottom - 4;
        while (
          overlaps({
            left: lx - 4,
            right: lx + labelWidth + 4,
            top: ly - labelFontSize - 3,
            bottom: ly + 4,
          }) &&
          ly > boardTop + labelFontSize
        ) {
          ly -= 13;
        }
        placed.push({
          left: lx - 4,
          right: lx + labelWidth + 4,
          top: ly - labelFontSize - 3,
          bottom: ly + 4,
        });
        return { point, lx, ly, anchor, offset: ly - py };
      });
  })();

  const toggleBoardModel = (id: string) => {
    setSelectedBoardIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setBoardHover(null);
  };

  return (
    <Chart
      title={view === "board" ? "Model comparison" : "Format comparison"}
      sub={
        view === "board"
          ? "Provider-coloured dots with one Pareto frontier. Key references are labeled; hover any point for its name and values."
          : "The original six-model comparison, one line per format. Higher and further right is better."
      }
    >
      <div className={s.chartControlRow}>
        <div
          className={s.axisToggle}
          role="tablist"
          aria-label="Chart view"
          onKeyDown={(event) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
            event.preventDefault();
            const nextView = view === "board" ? "formats" : "board";
            setView(nextView);
            setBoardHover(null);
            setFormatHover(null);
            requestAnimationFrame(() =>
              document
                .getElementById(
                  nextView === "board" ? "benchmark-models-tab" : "benchmark-formats-tab",
                )
                ?.focus(),
            );
          }}
        >
          <button
            id="benchmark-models-tab"
            type="button"
            role="tab"
            aria-selected={view === "board"}
            aria-controls="benchmark-model-chart-panel"
            aria-describedby="benchmark-model-view-description"
            tabIndex={view === "board" ? 0 : -1}
            className={`${s.axisBtn} ${view === "board" ? s.axisBtnOn : ""}`}
            onClick={() => {
              setView("board");
              setFormatHover(null);
            }}
          >
            Model comparison
          </button>
          <button
            id="benchmark-formats-tab"
            type="button"
            role="tab"
            aria-selected={view === "formats"}
            aria-controls="benchmark-format-chart-panel"
            aria-describedby="benchmark-format-view-description"
            tabIndex={view === "formats" ? 0 : -1}
            className={`${s.axisBtn} ${view === "formats" ? s.axisBtnOn : ""}`}
            onClick={() => {
              setView("formats");
              setBoardHover(null);
            }}
          >
            Format comparison
          </button>
          <span id="benchmark-model-view-description" className={s.tableCaption}>
            Compares OpenUI structural validity and cost across 30 models using provider-coloured
            dots and one Pareto frontier.
          </span>
          <span id="benchmark-format-view-description" className={s.tableCaption}>
            Compares validity and cost across OpenUI, A2UI, and json-render for six models.
          </span>
        </div>

        {view === "board" ? (
          <details className={s.modelSelect}>
            <summary
              aria-label={`Filter models, ${selectedBoardIds.size} of ${OPENUI_MODEL_BOARD.length} selected`}
            >
              <span>Models</span>
              <strong>
                {selectedBoardIds.size === OPENUI_MODEL_BOARD.length
                  ? `All ${OPENUI_MODEL_BOARD.length}`
                  : `${selectedBoardIds.size} / ${OPENUI_MODEL_BOARD.length}`}
              </strong>
              <span className={s.modelSelectChevron} aria-hidden>
                ↓
              </span>
            </summary>
            <div className={s.modelSelectMenu} role="group" aria-label="Models shown on chart">
              <span className={s.tableCaption} aria-live="polite">
                {selectedBoardIds.size} of {OPENUI_MODEL_BOARD.length} models selected
              </span>
              <div className={s.modelSelectActions}>
                <span>{selectedBoardIds.size} selected</span>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedBoardIds(new Set(OPENUI_MODEL_BOARD.map((point) => point.id)))
                  }
                >
                  All
                </button>
                <button type="button" onClick={() => setSelectedBoardIds(new Set())}>
                  None
                </button>
              </div>
              <div className={s.modelSelectList}>
                {PROVIDERS.map((provider) => {
                  const companyModels = OPENUI_MODEL_BOARD.filter(
                    (point) => point.provider === provider,
                  );
                  return (
                    <section
                      key={provider}
                      className={s.modelSelectGroup}
                      role="group"
                      aria-labelledby={`model-provider-${PROVIDERS.indexOf(provider)}`}
                    >
                      <div
                        id={`model-provider-${PROVIDERS.indexOf(provider)}`}
                        className={s.modelSelectGroupTitle}
                      >
                        <span
                          className={s.modelSelectDot}
                          style={{ background: PROVIDER_HUE[provider] }}
                          aria-hidden
                        />
                        <strong>{provider}</strong>
                        <span>{companyModels.length}</span>
                      </div>
                      {companyModels.map((point) => (
                        <label key={point.id}>
                          <input
                            type="checkbox"
                            checked={selectedBoardIds.has(point.id)}
                            onChange={() => toggleBoardModel(point.id)}
                          />
                          <span>{point.label}</span>
                        </label>
                      ))}
                    </section>
                  );
                })}
              </div>
            </div>
          </details>
        ) : null}
      </div>

      <div
        id={view === "board" ? "benchmark-model-chart-panel" : "benchmark-format-chart-panel"}
        ref={holder}
        role="tabpanel"
        aria-labelledby={view === "board" ? "benchmark-models-tab" : "benchmark-formats-tab"}
        className={`${s.svgHolder} ${s.frontier} ${s.edgeAligned}`}
        style={{ position: "relative" }}
      >
        {view === "board" ? (
          <svg
            className={s.svg}
            width={width + GUTTER}
            height={boardHeight}
            viewBox={`${-GUTTER} 0 ${width + GUTTER} ${boardHeight}`}
            style={{ marginLeft: -GUTTER }}
            role="img"
            aria-label={`OpenUI structural validity versus cost per task for ${visibleBoardPoints.length} selected models; vertical axis ranges from ${boardYMin} to 100 percent`}
          >
            {boardYTicks.map((tick) => (
              <g key={tick}>
                <line
                  x1={PL}
                  x2={PL + PW}
                  y1={boardY(tick)}
                  y2={boardY(tick)}
                  stroke="var(--rule)"
                />
                <text
                  x={PL - 12}
                  y={boardY(tick) + 4}
                  textAnchor="end"
                  fontSize="12.5"
                  fill="var(--ink-muted)"
                >
                  {tick}%
                </text>
              </g>
            ))}
            {boardXTicks.map((tick) => (
              <g key={tick}>
                <line
                  x1={boardX(tick)}
                  x2={boardX(tick)}
                  y1={boardTop}
                  y2={boardBottom}
                  stroke="var(--rule)"
                />
                <text
                  x={boardX(tick)}
                  y={boardBottom + 26}
                  textAnchor="middle"
                  fontSize="12.5"
                  fill="var(--ink-muted)"
                >
                  {hasFreeVisible && tick === boardMinCost ? "$0" : boardCostLabel(tick)}
                </text>
              </g>
            ))}
            <text x={PL + 4} y={boardTop - 15} fontSize="13.5" fill="var(--ink)">
              Structural validity vs cost, by model
            </text>
            <text
              className={s.axisTitle}
              transform={`translate(${PL - GUTTER + 16}, ${boardTop + boardPlotHeight / 2}) rotate(-90)`}
              textAnchor="middle"
            >
              Structural validity
            </text>
            <text x={PL + PW} y={boardTop - 15} textAnchor="end" fontSize="12.5" fill="var(--ink)">
              better ↗
            </text>
            <text className={s.axisTitle} x={PL + PW / 2} y={boardHeight - 10} textAnchor="middle">
              Cost per task · USD
            </text>
            {visiblePareto.length > 1 ? (
              <path
                className={s.fadeLate}
                d={visiblePareto
                  .map(
                    (point, index) =>
                      `${index === 0 ? "M" : "L"} ${boardX(modelBoardCostPerTask(point))} ${boardY(point.score)}`,
                  )
                  .join(" ")}
                fill="none"
                stroke="var(--ink)"
                strokeWidth={1.5}
                strokeOpacity={0.62}
                strokeLinejoin="round"
                strokeLinecap="round"
                aria-hidden="true"
              />
            ) : null}

            {visibleBoardPoints.map((point, index) => {
              const radius = 4.5;
              const px = boardX(modelBoardCostPerTask(point));
              const py = boardY(point.score);
              return (
                <g key={point.id}>
                  <circle
                    className={s.pt}
                    cx={px}
                    cy={py}
                    r={radius}
                    fill={PROVIDER_HUE[point.provider]}
                    stroke="var(--surface)"
                    strokeWidth={2}
                    aria-label={`${point.label}, ${point.provider}: ${point.score.toFixed(1)}% valid, ${"unpriced" in point ? "self-hosted, cost not comparable" : `$${modelBoardCostPerTask(point).toFixed(4)} per task`}`}
                    style={{ cursor: "default", "--d": `${300 + index * 18}ms` } as CSSProperties}
                    onMouseEnter={() => setBoardHover(point.id)}
                    onMouseLeave={() => setBoardHover(null)}
                  />
                </g>
              );
            })}
            {boardLabels.map(({ point, lx, ly, anchor, offset }) => (
              <g key={`label-${point.id}`} className={s.fadeLate}>
                {Math.abs(offset) > 6 ? (
                  <line
                    x1={boardX(modelBoardCostPerTask(point))}
                    y1={boardY(point.score)}
                    x2={anchor === "start" ? lx - 3 : lx + 3}
                    y2={ly - labelFontSize * 0.35}
                    stroke="var(--rule)"
                    strokeWidth={1}
                  />
                ) : null}
                <text
                  x={lx}
                  y={ly}
                  textAnchor={anchor}
                  fontSize={labelFontSize}
                  fontWeight={450}
                  fill="var(--ink-muted)"
                  stroke="var(--surface)"
                  strokeWidth={4}
                  paintOrder="stroke"
                >
                  {point.label}
                </text>
              </g>
            ))}
          </svg>
        ) : (
          <svg
            className={s.svg}
            width={width + GUTTER}
            height={H}
            viewBox={`${-GUTTER} 0 ${width + GUTTER} ${H}`}
            style={{ marginLeft: -GUTTER }}
            role="img"
            aria-label="Structural validity versus cost, one line per generative UI format across six models"
          >
            {[60, 70, 80, 90, 100].map((tick) => (
              <g key={tick}>
                <line
                  x1={PL}
                  x2={PL + PW}
                  y1={formatY(tick)}
                  y2={formatY(tick)}
                  stroke="var(--rule)"
                />
                <text
                  x={PL - 12}
                  y={formatY(tick) + 4}
                  textAnchor="end"
                  fontSize="12.5"
                  fill="var(--ink-muted)"
                >
                  {tick}%
                </text>
              </g>
            ))}
            {[9, 6, 3, 0].map((tick) => (
              <g key={tick}>
                <line
                  x1={formatX(tick)}
                  x2={formatX(tick)}
                  y1={formatY(100)}
                  y2={PAD.top + PH}
                  stroke="var(--rule)"
                />
                <text
                  x={formatX(tick)}
                  y={PAD.top + PH + 28}
                  textAnchor="middle"
                  fontSize="12.5"
                  fill="var(--ink-muted)"
                >
                  ${tick}
                </text>
              </g>
            ))}
            {/* The board's bottom and right edges land on ticks (20% and
                free/local); this view's floor is 66% with no tick there, so the
                frame is drawn explicitly and the two tabs match. */}
            <line x1={PL} x2={PL + PW} y1={PAD.top + PH} y2={PAD.top + PH} stroke="var(--rule)" />
            <line x1={PL + PW} x2={PL + PW} y1={PAD.top} y2={PAD.top + PH} stroke="var(--rule)" />
            <defs>
              <linearGradient
                id="chart-gemini-gradient"
                x1={GEMINI_GRADIENT.from.x}
                y1={GEMINI_GRADIENT.from.y}
                x2={GEMINI_GRADIENT.to.x}
                y2={GEMINI_GRADIENT.to.y}
              >
                {GEMINI_GRADIENT.stops.map((stop) => (
                  <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
                ))}
              </linearGradient>
            </defs>
            <text x={PL + 4} y={formatY(100) - 14} fontSize="13.5" fill="var(--ink)">
              Structural validity vs cost, by format
            </text>
            <text
              className={s.axisTitle}
              transform={`translate(${PL - GUTTER + 16}, ${PAD.top + PH / 2}) rotate(-90)`}
              textAnchor="middle"
            >
              Structural validity
            </text>
            <text
              x={PL + PW}
              y={formatY(100) - 14}
              textAnchor="end"
              fontSize="12.5"
              fill="var(--ink)"
            >
              better ↗
            </text>
            <text className={s.axisTitle} x={PL + PW / 2} y={H - 10} textAnchor="middle">
              Cost of one benchmark pass · 46 screens
            </text>
            {[...formatSeries].reverse().map(({ format, points }) => {
              const stroke = FORMAT_HUE[format];
              const ours = format === "openui";
              const first = points[0];
              return (
                <g key={format}>
                  <polyline
                    className={s.line}
                    pathLength={1}
                    points={points.map((p) => `${formatX(p.cost)},${formatY(p.score)}`).join(" ")}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={ours ? 1.75 : 1.4}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    style={{ "--d": `${activeFormats.indexOf(format) * 120}ms` } as CSSProperties}
                  />
                  {points.map((point, index) => {
                    const radius =
                      5 + (formatHover?.m === point.model && formatHover?.f === format ? 1.5 : 0);
                    return (
                      <rect
                        key={point.model}
                        className={s.pt}
                        x={formatX(point.cost) - radius}
                        y={formatY(point.score) - radius}
                        width={radius * 2}
                        height={radius * 2}
                        fill={ours ? "var(--surface)" : stroke}
                        stroke={stroke}
                        strokeWidth={ours ? 2.5 : 0}
                        aria-label={`${formatLabel(format)}, ${MODEL_NAME[point.model]}: ${point.score.toFixed(1)}% valid, $${point.cost.toFixed(2)} per pass`}
                        style={
                          { cursor: "default", "--d": `${350 + index * 45}ms` } as CSSProperties
                        }
                        onMouseEnter={() => setFormatHover({ m: point.model, f: format })}
                        onMouseLeave={() => setFormatHover(null)}
                      />
                    );
                  })}
                  {!narrow && (
                    <text
                      className={s.fadeLate}
                      x={formatX(first.cost) - 14}
                      y={formatY(first.score) + 5}
                      textAnchor="end"
                      fontSize="14"
                      fontWeight={600}
                      fill={stroke}
                      stroke="var(--surface)"
                      strokeWidth={4}
                      paintOrder="stroke"
                    >
                      {formatLabel(format)}
                    </text>
                  )}
                </g>
              );
            })}
            {!narrow &&
              formatSeries.flatMap(({ format, points }) =>
                points.map((point) => {
                  const model = MODELS.find((item) => item.id === point.model)!;
                  const vb = Number(markViewBox(model.mark).split(" ")[2]);
                  const above = formatY(point.score) - 27;
                  const gy =
                    format === "jsonRender" || above < PAD.top ? formatY(point.score) + 12 : above;
                  return (
                    <path
                      key={`${format}-${point.model}-mark`}
                      className={s.fadeLate}
                      d={BRAND_MARKS[model.mark]}
                      transform={`translate(${formatX(point.cost) - 8}, ${gy}) scale(${16 / vb})`}
                      fill={
                        model.mark === "gemini"
                          ? "url(#chart-gemini-gradient)"
                          : (BRAND_COLORS[model.mark] ?? "var(--ink-muted)")
                      }
                    />
                  );
                }),
              )}
          </svg>
        )}

        {view === "board" && hoveredBoard ? (
          <div
            className={s.hoverCard}
            style={{
              left: Math.min(
                Math.max(boardX(modelBoardCostPerTask(hoveredBoard)), 138),
                width - 138,
              ),
              top: boardY(hoveredBoard.score) - 12,
            }}
          >
            <strong>{hoveredBoard.label}</strong>
            <span>{hoveredBoard.provider}</span>
            <span>
              {hoveredBoard.score.toFixed(1)}% valid ·{" "}
              {"unpriced" in hoveredBoard
                ? "Self-hosted · cost not comparable"
                : modelBoardCostPerTask(hoveredBoard) === 0
                  ? "Free"
                  : `$${modelBoardCostPerTask(hoveredBoard).toFixed(modelBoardCostPerTask(hoveredBoard) < 0.01 ? 4 : 3)} / task`}
            </span>
          </div>
        ) : null}
        {view === "formats" && formatHover && hoveredFormat ? (
          <div
            className={s.hoverCard}
            style={{
              left: Math.min(Math.max(formatX(hoveredFormat.cost), 130), width - 130),
              top: formatY(hoveredFormat.score) - 14,
            }}
          >
            <strong>
              {formatLabel(formatHover.f)} · {MODEL_NAME[formatHover.m]}
            </strong>
            {hoveredFormat.score.toFixed(1)}% valid · ${hoveredFormat.cost.toFixed(2)} per pass
          </div>
        ) : null}
      </div>

      <div
        id={view === "board" ? "benchmark-format-chart-panel" : "benchmark-model-chart-panel"}
        role="tabpanel"
        aria-labelledby={view === "board" ? "benchmark-formats-tab" : "benchmark-models-tab"}
        hidden
      >
        {view === "board"
          ? "Format comparison data is available in the chart data tables below."
          : "Model comparison data is available in the chart data tables below."}
      </div>

      {view === "board" ? (
        <div className={`${s.legend} ${s.legendCenter}`} aria-label="Model provider key">
          <span className={s.key}>
            <span className={s.paretoKeyLine} aria-hidden />
            Pareto frontier
          </span>
          {visibleProviders.map((provider) => (
            <span key={provider} className={s.key}>
              <span className={s.dot} style={{ background: PROVIDER_HUE[provider] }} aria-hidden />
              {provider}
            </span>
          ))}
        </div>
      ) : narrow ? (
        <div className={`${s.legend} ${s.legendCenter} ${s.frontier}`} aria-label="Format key">
          {FORMATS.filter((f) => activeFormats.includes(f.id)).map((f) => (
            <span key={f.id} className={s.key}>
              <span className={s.dot} style={{ background: FORMAT_HUE[f.id] }} aria-hidden />
              {f.label}
            </span>
          ))}
        </div>
      ) : (
        <div className={`${s.legend} ${s.legendCenter}`} aria-label="Model key">
          {MODELS.filter((m) => pricedModels.includes(m.id)).map((m) => (
            <span key={m.id} className={s.key}>
              <Mark id={m.mark} brand />
              {MODEL_NAME[m.id]}
            </span>
          ))}
        </div>
      )}

      <ChartDataDisclosure label="View chart data">
        <section className={s.dataSection} aria-labelledby="benchmark-model-data-heading">
          <h3 id="benchmark-model-data-heading" className={s.dataSectionHeading}>
            Model comparison data
          </h3>
          <table className={s.dataTable}>
            <caption>
              OpenUI model-board structural validity and measured cost for all models
            </caption>
            <thead>
              <tr>
                <th scope="col">Model</th>
                <th scope="col">Provider</th>
                <th scope="col">Family</th>
                <th scope="col" data-numeric="true">
                  Valid
                </th>
                <th scope="col" data-numeric="true">
                  Cost per task
                </th>
                <th scope="col">Pricing</th>
                <th scope="col">Frontier (all 30)</th>
                <th scope="col">Shown in chart</th>
              </tr>
            </thead>
            <tbody>
              {OPENUI_MODEL_BOARD.map((point) => {
                const family = modelBoardFamilyFor(point.id);
                const unpriced = "unpriced" in point;
                const cost = modelBoardCostPerTask(point);
                return (
                  <tr key={`data-${point.id}`}>
                    <th scope="row">{point.label}</th>
                    <td>{point.provider}</td>
                    <td>{family?.label ?? "—"}</td>
                    <td data-numeric="true">{point.score.toFixed(1)}%</td>
                    <td data-numeric="true">
                      {unpriced
                        ? "Not comparable"
                        : cost === 0
                          ? "$0 / free"
                          : `$${cost.toFixed(4)}`}
                    </td>
                    <td>{unpriced ? "Self-hosted" : cost === 0 ? "Free" : "List price"}</td>
                    <td>
                      {!unpriced && BOARD_PARETO.some((row) => row.id === point.id) ? "Yes" : "No"}
                    </td>
                    <td>{selectedBoardIds.has(point.id) ? "Yes" : "No"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className={s.dataNote}>
            All 30 models remain in this table and the downloads, including models hidden by the
            chart&rsquo;s default filter. Frontier membership here is computed over all 30, so it
            does not shift with the chart&rsquo;s selection; the drawn line is the frontier of the
            models currently shown. Self-hosted cost is unknown, not zero. Filter state is preserved
            in this page&rsquo;s URL. Focused benchmark:{" "}
            <a href="/benchmarks/language">language and model results</a>. Full dataset:{" "}
            <a href="/benchmarks/data.json">JSON</a>, <a href="/benchmarks/data.csv">CSV</a>, or{" "}
            <a href="/benchmarks/agent.md">agent Markdown</a>.
          </p>
        </section>
        <section className={s.dataSection} aria-labelledby="benchmark-format-data-heading">
          <h3 id="benchmark-format-data-heading" className={s.dataSectionHeading}>
            Format comparison data
          </h3>
          <table className={s.dataTable}>
            <caption>
              Structural validity and cost per 46-screen pass for each model and format
            </caption>
            <thead>
              <tr>
                <th scope="col">Model</th>
                <th scope="col">Format</th>
                <th scope="col" data-numeric="true">
                  Valid
                </th>
                <th scope="col" data-numeric="true">
                  Cost per pass
                </th>
              </tr>
            </thead>
            <tbody>
              {formatSeries.flatMap(({ format, points }) =>
                points.map((point) => (
                  <tr key={`data-${format}-${point.model}`}>
                    <th scope="row">{MODEL_NAME[point.model]}</th>
                    <td>{formatLabel(format)}</td>
                    <td data-numeric="true">{point.score.toFixed(1)}%</td>
                    <td data-numeric="true">${point.cost.toFixed(2)}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
          <p className={s.dataNote}>
            Focused benchmark: <a href="/benchmarks/framework">framework comparison</a>. Download
            this comparison as <a href="/benchmarks/framework/data.json">JSON</a>,{" "}
            <a href="/benchmarks/framework/data.csv">CSV</a>, or{" "}
            <a href="/benchmarks/framework/agent.md">agent Markdown</a>.
          </p>
        </section>
      </ChartDataDisclosure>
    </Chart>
  );
}
