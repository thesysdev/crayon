"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { FoldBreak, FoldHeader } from "../../components/FoldHeader/FoldHeader";
import { ChartCard } from "../ChartCard/ChartCard";
import styles from "./HowItWorksSection.module.css";

/* Fold 3: how it works, as three steps that follow one example from start to
   finish: a component you register, the answer the model writes with it, and
   the screen OpenUI renders. The steps advance on their own while the fold is
   on screen, until the reader picks one. */

const STEP_MS = 6000;

/* Step 1's library: five components, each with the schema the model sees.
   Step 2's answer uses only these, so the two steps visibly connect. */
const COMPONENTS: { name: string; code: string }[] = [
  {
    name: "Card",
    code: `const Card = defineComponent({
  name: "Card",
  description: "A container that groups other components.",
  props: z.object({
    children: z.array(
      z.union([StatCard.ref, BarChart.ref, Table.ref, Button.ref]),
    ),
  }),
  component: ({ props, renderNode }) => (
    <YourCard>{renderNode(props.children)}</YourCard>
  ),
});`,
  },
  {
    name: "StatCard",
    code: `const StatCard = defineComponent({
  name: "StatCard",
  description: "A headline number with a label.",
  props: z.object({
    label: z.string(),
    value: z.string(),
    change: z.string().optional(),
  }),
  component: ({ props }) => <YourStatCard {...props} />,
});`,
  },
  {
    name: "BarChart",
    code: `const BarChart = defineComponent({
  name: "BarChart",
  description: "Compares values across categories.",
  props: z.object({
    title: z.string(),
    labels: z.array(z.string()),
    values: z.array(z.number()),
  }),
  component: ({ props }) => <YourBarChart {...props} />,
});`,
  },
  {
    name: "Table",
    code: `const Table = defineComponent({
  name: "Table",
  description: "Rows of data under column headings.",
  props: z.object({
    columns: z.array(z.string()),
    rows: z.array(z.array(z.string())),
  }),
  component: ({ props }) => <YourTable {...props} />,
});`,
  },
  {
    name: "Button",
    code: `const Button = defineComponent({
  name: "Button",
  description: "An action the user can take next.",
  props: z.object({
    label: z.string(),
    prompt: z.string().optional(),
  }),
  component: ({ props }) => <YourButton {...props} />,
});`,
  },
];

const COMPONENT_NAMES = COMPONENTS.map((c) => c.name);
const SCHEMA_MS = 1200;

const MODEL_PROGRAM = `root = Card([total, chart, next])
total = StatCard("Total sales", "$16.19M", "+10.7%")
chart = BarChart("Sales by region",
  ["N. America", "Europe", "APAC", "LATAM"],
  [6.10, 4.35, 3.91, 1.83])
next = Button("Break it down by channel")`;

type Step = {
  title: string;
  body: string;
  visual: () => ReactNode;
};

const STEPS: Step[] = [
  {
    title: "Register your components",
    body: "Describe the components your product already has: their names, and the props they take. That is the only vocabulary the model can use.",
    visual: () => <RegisterVisual />,
  },
  {
    title: "The model picks what to show",
    body: "For each request, the model decides which components fit and writes a short description of the screen, instead of paragraphs of text.",
    visual: () => <ModelVisual />,
  },
  {
    title: "OpenUI renders it, live",
    body: "OpenUI turns that description into your real components as it streams in. Users click, filter, and fill them in, right inside the conversation.",
    visual: () => <RenderVisual />,
  },
];

export function HowItWorksSection() {
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.35,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (pinned || !visible) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => setActive((i) => (i + 1) % STEPS.length), STEP_MS);
    return () => window.clearTimeout(id);
  }, [active, pinned, visible]);

  return (
    <section ref={ref} className={styles.section} aria-labelledby="how-it-works-title">
      <FoldHeader
        id="how-it-works-title"
        title={
          <>
            You choose the components. <FoldBreak />
            The model picks what to show.
          </>
        }
        subtitle="Works with any model, any frontend framework, and any design system or component library you already use."
      />

      <div className={styles.walkthrough}>
        <ol className={styles.steps}>
          {STEPS.map(({ title, body }, index) => {
            const isActive = index === active;
            return (
              <li key={title}>
                <button
                  type="button"
                  className={`${styles.step} ${isActive ? styles.stepActive : ""}`.trim()}
                  aria-current={isActive ? "step" : undefined}
                  onClick={() => {
                    setActive(index);
                    setPinned(true);
                  }}
                >
                  <span className={styles.stepNumber}>{index + 1}</span>
                  <span className={styles.stepText}>
                    <span className={styles.stepTitle}>{title}</span>
                    <span className={styles.stepBody}>{body}</span>
                  </span>
                  {isActive && !pinned && visible && (
                    <span
                      key={`progress-${active}`}
                      className={styles.stepProgress}
                      style={{ animationDuration: `${STEP_MS}ms` }}
                      aria-hidden="true"
                    />
                  )}
                </button>
                {/* Phones show each step's picture under its own text. */}
                {isActive && <div className={styles.inlineVisual}>{STEPS[index].visual()}</div>}
              </li>
            );
          })}
        </ol>

        <div className={styles.stage} aria-live="polite">
          <div key={active} className={styles.stageInner}>
            {STEPS[active].visual()}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Step visuals ── */

function Window({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={styles.window}>
      <div className={styles.windowBar}>
        <span className={styles.dots} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className={styles.windowTitle}>{title}</span>
      </div>
      <div className={styles.windowBody}>{children}</div>
    </div>
  );
}

function RegisterVisual() {
  const [shown, setShown] = useState(0);
  const [picked, setPicked] = useState(false);

  // Walks through all five schemas within the step's own time, until the
  // reader picks one.
  useEffect(() => {
    if (picked) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => setShown((i) => (i + 1) % COMPONENTS.length), SCHEMA_MS);
    return () => window.clearTimeout(id);
  }, [shown, picked]);

  return (
    <div className={styles.visualStack}>
      <div className={styles.library} role="tablist" aria-label="Your component library">
        <span className={styles.libraryLabel}>Your library</span>
        {COMPONENTS.map(({ name }, index) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={index === shown}
            className={`${styles.libraryChip} ${index === shown ? styles.libraryChipNew : ""}`.trim()}
            onClick={() => {
              setShown(index);
              setPicked(true);
            }}
          >
            {name}
          </button>
        ))}
      </div>
      <Window title={`library.tsx · ${COMPONENTS[shown].name}`}>
        <pre key={shown} className={`${styles.code} ${styles.codeSwap}`}>
          <code>{COMPONENTS[shown].code}</code>
        </pre>
      </Window>
    </div>
  );
}

function ModelVisual() {
  const [chars, setChars] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Show the whole answer at once, set from a frame callback rather than the effect body.
      const frame = requestAnimationFrame(() => setChars(MODEL_PROGRAM.length));
      return () => cancelAnimationFrame(frame);
    }
    const id = window.setInterval(() => {
      setChars((c) => {
        const next = Math.min(MODEL_PROGRAM.length, c + 6);
        if (next >= MODEL_PROGRAM.length) window.clearInterval(id);
        return next;
      });
    }, 30);
    return () => window.clearInterval(id);
  }, []);

  const streaming = chars < MODEL_PROGRAM.length;

  return (
    <div className={styles.visualStack}>
      <div className={styles.prompt}>
        <span>How did our ad spend compare with sales by region?</span>
        <span className={styles.promptSend} aria-hidden="true">
          <ArrowUp size={14} strokeWidth={2.25} />
        </span>
      </div>
      <Window title={streaming ? "Model is answering…" : "Model answer"}>
        <pre className={styles.code}>
          <code>
            {highlight(MODEL_PROGRAM.slice(0, chars))}
            {streaming && <span className={styles.caret} />}
          </code>
        </pre>
      </Window>
    </div>
  );
}

/* Component names stand out in the model's answer, so the link back to step 1
   is visible: every one of them is a component registered there. */
function highlight(source: string) {
  const parts = source.split(new RegExp(`\\b(${COMPONENT_NAMES.join("|")})\\b`));
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <span key={index} className={styles.tokenNew}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function RenderVisual() {
  return (
    <div className={styles.visualStack}>
      <div className={styles.rendered}>
        <ChartCard />
      </div>
      <p className={styles.renderNote}>Rendered with your components. Hover the bars.</p>
    </div>
  );
}
