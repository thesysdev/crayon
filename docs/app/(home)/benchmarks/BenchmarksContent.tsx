"use client";

import {
  CompletionByModel,
  CostPerPass,
  TokenOverhead,
} from "@/components/charts/benchmark-charts";
import { BlankScreensPanels } from "@/components/charts/blank-screens-panels";
import { CompletionByDensity } from "@/components/charts/completion-by-density";
import { VizSkin } from "@/components/charts/primitives";
import { ReliabilityByModel } from "@/components/charts/reliability-by-model";
import { RepairFunnelFlow } from "@/components/charts/repair-funnel-flow";
import { SpeedTokens } from "@/components/charts/speed-tokens";
import {
  BRIEFS,
  COST_MODELS,
  FORMAT_ORDER,
  LINKS,
  MODELS,
  RUNS_PER_FORMAT,
  blankScreens,
  completionByDensity,
  completionOver,
  costPerPass,
  repairedShare,
} from "@/lib/benchmark-data";
import { ChartLineUp, CurrencyDollarSimple, ShieldCheck, Wrench } from "@phosphor-icons/react";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { CloudCtaSection } from "../cloud/CloudCtaSection";
import { BevelButton } from "../components/Button/BevelButton";
import {
  FeatureGridSection,
  type GridFeature,
} from "../sections/FeatureGridSection/FeatureGridSection";
import s from "./benchmarks.module.css";

const ALL_MODELS = MODELS.map((model) => model.id);
const BLOG_HREF = "/blog/generative-ui-benchmark";

const BLANK_RATE = (1 - blankScreens.openui / RUNS_PER_FORMAT) * 100;

const costRatios = COST_MODELS.flatMap((model) =>
  (["a2ui", "jsonRender"] as const).map(
    (format) => costPerPass[model]![format] / costPerPass[model]!.openui,
  ),
);
const CHEAPER_LOW = Math.min(...costRatios);
const CHEAPER_HIGH = Math.max(...costRatios);

const HARDEST_SCREENS = completionByDensity[completionByDensity.length - 1];

/* The four headline results, written for someone who has never read a
   benchmark. Every number is derived above, never typed. */
const HEADLINE_FEATURES: GridFeature[] = [
  {
    Icon: ShieldCheck,
    title: `${BLANK_RATE.toFixed(1)}% render rate`,
    description: `Only ${blankScreens.openui} of ${RUNS_PER_FORMAT.toLocaleString()} screens came back blank.`,
  },
  {
    Icon: ChartLineUp,
    title: `${completionOver("openui").toFixed(1)}% correct`,
    description: "Everything the brief asked for, tied for first across six models.",
  },
  {
    Icon: CurrencyDollarSimple,
    title: `${CHEAPER_LOW.toFixed(1)} to ${CHEAPER_HIGH.toFixed(1)}× cheaper`,
    description: "Half the tokens: lower cost, faster streaming.",
  },
  {
    Icon: Wrench,
    title: `${repairedShare().toFixed(0)}% auto-repaired`,
    description: "OpenUI Cloud fixes broken generations before users see them.",
  },
];

function Section({
  id,
  title,
  question,
  description,
  insight,
  band,
  hideChartHead = false,
  spacious = false,
  children,
}: {
  id: string;
  title: string;
  question?: string;
  description: ReactNode;
  insight: ReactNode;
  band?: string;
  hideChartHead?: boolean;
  spacious?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`${s.section} ${hideChartHead ? s.sectionBare : ""} ${
        spacious ? s.sectionSpacious : ""
      }`}
      aria-labelledby={`${id}-heading`}
    >
      <div className={s.sectionHeader}>
        <div className={s.sectionHeading}>
          {band ? <p className={s.bandLabel}>{band}</p> : null}
          <h2 id={`${id}-heading`} className={s.sectionTitle}>
            {title}
          </h2>
          {question ? <p className={s.sectionQuestion}>{question}</p> : null}
        </div>
        <div className={s.sectionAside}>
          <p>{description}</p>
        </div>
      </div>
      <div className={s.insightBar}>
        <p>{insight}</p>
      </div>
      <div className={s.sectionBody}>{children}</div>
    </section>
  );
}

export function BenchmarksContent() {
  return (
    <main className={s.page}>
      <VizSkin vivid>
        <header className={s.hero}>
          <div className={s.heroLockup}>
            <p className={s.heroAside}>
              46 real screens, 6 models, 3 formats: 1,104 scored runs each
            </p>
            <div className={s.heroCopy}>
              <p className={s.heroEyebrow}>
                <span>OpenUI</span>
                <span className={s.heroTag}>Benchmarks</span>
              </p>
              <h1 className={s.heroTitle}>
                <span>Generative UI</span>
                <span>Benchmark</span>
              </h1>
            </div>
            <div className={s.heroActions}>
              <BevelButton
                href="/benchmarks/methodology"
                label="Methodology"
                variant="primary"
                className={s.heroButton}
                badge={
                  <ArrowUpRight className={s.actionIcon} strokeWidth={2.25} aria-hidden="true" />
                }
              />
              <BevelButton
                href={LINKS.rawData}
                label="Raw data"
                variant="secondary"
                className={s.heroButton}
                external
                badge={
                  <ArrowUpRight className={s.actionIcon} strokeWidth={2.25} aria-hidden="true" />
                }
              />
            </div>
          </div>
        </header>

        <section className={s.heroGrid} aria-label="Benchmark overview">
          <ReliabilityByModel models={ALL_MODELS} formats={FORMAT_ORDER} />
        </section>

        <div className={s.featureBand} aria-label="Headline results">
          <FeatureGridSection
            features={HEADLINE_FEATURES}
            showHeader={false}
            showCompat={false}
            showBottomSeparator={false}
            showTopSeparator
            desktopColumns={4}
          />
        </div>

        <div className={s.column}>
          <Section
            id="blank-screens"
            title="Render rate"
            question="How often a screen rendered"
            description={
              <>
                1,104 runs per format across 6 models. <br />
                The scale starts at 88%.
              </>
            }
            insight={
              <>
                OpenUI Lang: {blankScreens.openui} blank screens in{" "}
                {RUNS_PER_FORMAT.toLocaleString()} runs. A2UI: at least {blankScreens.a2ui}.
                json-render: {blankScreens.jsonRender}.
              </>
            }
            hideChartHead
          >
            <BlankScreensPanels models={ALL_MODELS} formats={FORMAT_ORDER} />
          </Section>

          <Section
            id="completion"
            title="Completion rate by model"
            question="Everything asked for, rendered"
            description={
              <>
                Judged by each format&rsquo;s own SDK, <br />4 runs per brief.
              </>
            }
            insight={
              <>
                A statistical tie: {completionOver("openui").toFixed(1)}% vs{" "}
                {completionOver("a2ui").toFixed(1)}%. The winner changes by model.
              </>
            }
            hideChartHead
          >
            <CompletionByModel models={ALL_MODELS} formats={FORMAT_ORDER} note={null} />
          </Section>

          <Section
            id="cost"
            title="Token consumption and cost"
            question="Tokens and dollars for the same screens"
            description={
              <>
                46 screens, <br />
                priced at provider list prices.
              </>
            }
            insight={
              <>
                OpenUI Lang is {CHEAPER_LOW.toFixed(1)}–{CHEAPER_HIGH.toFixed(1)}× cheaper on every
                priced model.
              </>
            }
            spacious
          >
            <TokenOverhead
              formats={FORMAT_ORDER}
              sub="System prompt plus output for one screen."
              note={null}
            />
            <CostPerPass
              models={ALL_MODELS}
              formats={FORMAT_ORDER}
              sub={`The same ${BRIEFS} screens at list prices.`}
              note={null}
            />
          </Section>

          <Section
            id="speed"
            title="Output tokens"
            question="The same screens written four ways"
            description={
              <>
                From an earlier run <br />
                with a different format set.
              </>
            }
            insight="About half the tokens, so screens stream about twice as fast."
            hideChartHead
          >
            <SpeedTokens note={null} />
          </Section>

          <Section
            id="density"
            title="Completion by screen complexity"
            question="From simple to complex screens"
            description={
              <>
                46 briefs in 5 bands, <br />
                about 9 per band.
              </>
            }
            insight={
              <>
                On the hardest briefs, OpenUI Lang completes {HARDEST_SCREENS.openui.toFixed(0)}%
                and A2UI {HARDEST_SCREENS.a2ui.toFixed(0)}%; json-render falls to{" "}
                {HARDEST_SCREENS.jsonRender.toFixed(0)}%.
              </>
            }
            hideChartHead
          >
            <CompletionByDensity models={ALL_MODELS} formats={FORMAT_ORDER} note={null} />
          </Section>
        </div>

        <div className={s.productionBand}>
          <div className={s.column}>
            <Section
              id="production"
              title="Production repair"
              question="What gets fixed before users see it"
              description={
                <>
                  Based on real production data: <br />
                  OpenUI Cloud traffic, not benchmark runs.
                </>
              }
              insight={
                <>
                  OpenUI Cloud repaired {repairedShare().toFixed(0)}% of invalid generations before
                  a user saw them.
                </>
              }
              hideChartHead
            >
              <RepairFunnelFlow />
            </Section>
          </div>
        </div>

        <CloudCtaSection
          title="Improve your generative UI reliability with OpenUI Cloud."
          primary={{
            label: "Get OpenUI Cloud",
            href: "https://console.thesys.dev/keys",
            external: true,
          }}
          secondary={{ label: "Learn more", href: "/cloud" }}
        />
      </VizSkin>
    </main>
  );
}
