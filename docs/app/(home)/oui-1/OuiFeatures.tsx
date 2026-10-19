import { SCATTER } from "@/lib/diffusion-blog-data";
import {
  IllustratedFeature,
  IllustratedFeatures,
} from "../components/IllustratedFeatures/IllustratedFeatures";
import { DeviceScene, RevenueCard } from "./OuiDeviceScene";
import styles from "./OuiFeatures.module.css";

/* ---------- Up to 500 tokens/sec ---------- */
// Rows of token-sized blocks. Widths and tones come from a seeded generator so
// the server and client render the same field.
const TOKEN_ROWS = (() => {
  let seed = 7;
  const next = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  return Array.from({ length: 11 }, (_, row) => ({
    // seconds for one full pass; neighbouring rows never share a speed
    duration: 2.5 + ((row * 5) % 7) * 0.3,
    blocks: Array.from({ length: 30 }, () => ({
      width: 6 + Math.round(next() * 16),
      tone: next() > 0.9 ? "accent" : next() > 0.5 ? "strong" : "soft",
    })),
  }));
})();

function PipelineIllustration() {
  return (
    /* A fixed 588x360 composition that scales with the stage: tokens stream in
       from the left and run under the response they become, the same card the
       stream illustration ends on. */
    <div className={styles.pipeScene} aria-hidden="true">
      <div className={styles.pipeRows}>
        {TOKEN_ROWS.map((row, i) => (
          <div key={i} className={styles.pipeRow} style={{ animationDuration: `${row.duration}s` }}>
            {/* two copies, so the loop has no seam */}
            {[0, 1].map((copy) =>
              row.blocks.map((block, j) => (
                <span key={`${copy}-${j}`} data-tone={block.tone} style={{ width: block.width }} />
              )),
            )}
          </div>
        ))}
      </div>
      <div className={styles.pipeCard}>
        <RevenueCard />
      </div>
    </div>
  );
}

/* ---------- 71.7% benchmark score ---------- */
function BenchmarkChart() {
  const base = SCATTER.find((p) => p.ghost)!;
  const hero = SCATTER.find((p) => p.hero)!;
  // Heights are true to a 0-100% scale; the axis itself is left out.
  const y = (score: number) => 246 - (score / 100) * 228;
  const from = { x: 48, y: y(base.score) };
  const to = { x: 336, y: y(hero.score) };
  const curve = `M${from.x} ${from.y} C ${from.x + 130} ${from.y}, ${to.x - 110} ${to.y}, ${to.x} ${to.y}`;

  return (
    <svg
      className={styles.chart}
      viewBox="0 0 384 280"
      role="img"
      aria-label={`Generative UI Benchmark: the base model scores ${base.score}%, OUI-1 scores ${hero.score}%.`}
    >
      <defs>
        <linearGradient id="oui-bench-rise" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className={styles.chartAreaTop} />
          <stop offset="1" className={styles.chartAreaBottom} />
        </linearGradient>
      </defs>
      <path d={`${curve} L ${to.x} 280 L ${from.x} 280 Z`} fill="url(#oui-bench-rise)" />
      <path className={styles.chartCurve} d={curve} />
      <circle className={styles.chartDot} cx={from.x} cy={from.y} r="4" />
      <text className={styles.chartLabel} x={from.x} y={from.y + 24} fontSize="12">
        Base model · {base.score}%
      </text>
      <circle className={styles.chartHeroHalo} cx={to.x} cy={to.y} r="12" />
      <circle className={styles.chartHero} cx={to.x} cy={to.y} r="5" />
      <text className={styles.chartHeroLabel} x={to.x} y={to.y - 22} textAnchor="end" fontSize="14">
        OUI-1 · {hero.score}%
      </text>
    </svg>
  );
}

/* ---------- 4B active parameters ---------- */
function ParamsIllustration() {
  const TOTAL = 26;
  const ACTIVE = 4;
  // Two squares whose areas are in the ratio of the parameter counts.
  const OUTER = 144;
  const inner = Math.round(OUTER * Math.sqrt(ACTIVE / TOTAL));
  return (
    <div className={styles.params} style={{ width: OUTER, height: OUTER }} aria-hidden="true">
      <span className={styles.paramsTotal}>{TOTAL}B</span>
      <span className={styles.paramsActive} style={{ width: inner, height: inner }}>
        {ACTIVE}B
      </span>
    </div>
  );
}

/* ---------- Runs on consumer hardware ---------- */
function HardwareIllustration() {
  // Nine pins a side, and three traces a side from the die out to the package edge.
  const pins = Array.from({ length: 9 }, (_, i) => 44 + i * 14);
  const traces = [82, 100, 118];
  return (
    <svg width="184" height="184" viewBox="0 0 200 200" fill="none" aria-hidden="true">
      <g className={styles.chipPin}>
        {pins.map((p) => (
          <path key={p} d={`M${p} 14v14M${p} 172v14M14 ${p}h14M172 ${p}h14`} />
        ))}
      </g>
      <rect className={styles.chipBody} x="28" y="28" width="144" height="144" rx="14" />
      <rect className={styles.chipRing} x="40" y="40" width="120" height="120" rx="8" />
      <g className={styles.chipTrace}>
        {traces.map((p) => (
          <path key={p} d={`M${p} 40v22M${p} 138v22M40 ${p}h22M138 ${p}h22`} />
        ))}
      </g>
      <circle className={styles.chipMark} cx="50" cy="50" r="2.5" />
      <rect className={styles.chipCore} x="62" y="62" width="76" height="76" rx="6" />
      <text className={styles.chipText} x="100" y="99" textAnchor="middle" fontSize="12">
        RTX 5090
      </text>
      <text className={styles.chipSub} x="100" y="116" textAnchor="middle" fontSize="12">
        FP8
      </text>
    </svg>
  );
}

export function OuiFeatures() {
  return (
    <IllustratedFeatures>
      <IllustratedFeature
        span="half"
        title="Streams as it generates"
        description="Screens start appearing before generation finishes."
      >
        <DeviceScene />
      </IllustratedFeature>
      <IllustratedFeature
        span="half"
        title="Up to 500 tokens/sec"
        description="Ultra-fast generation for responsive interfaces."
      >
        <PipelineIllustration />
      </IllustratedFeature>
      <IllustratedFeature
        span="third"
        shader={false}
        title="71.7% benchmark score"
        description="5.5× its base model’s score on the Generative UI Benchmark."
      >
        <BenchmarkChart />
      </IllustratedFeature>
      <IllustratedFeature
        span="third"
        shader={false}
        title="4B active parameters"
        description="A compact model purpose-built for Generative UI."
      >
        <ParamsIllustration />
      </IllustratedFeature>
      <IllustratedFeature
        span="third"
        shader={false}
        title="Runs on consumer hardware"
        description="Bring interface generation onto your own hardware."
      >
        <HardwareIllustration />
      </IllustratedFeature>
    </IllustratedFeatures>
  );
}
