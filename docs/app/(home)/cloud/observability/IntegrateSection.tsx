import { CloudCodeBlock } from "../CloudCodeBlock";
import styles from "../sections.module.css";

/* Two steps, each with the change it describes beside it — the same shape as the
   Gateway page's stepper. Verified against packages/observability-cloud: the
   package name, `init`, and the `pk-th-…` key format all come from
   CloudObservabilityOptions rather than from the brief, which named the package
   two different ways. */
const STEPS = [
  {
    title: "Generate a frontend key",
    description:
      "Publishable keys are safe to ship in client code, the same way an analytics key is.",
    href: "https://console.thesys.dev/client-api-keys",
  },
  {
    title: "Initialise the SDK",
    description:
      "Add it once, in your root layout. It attaches to the OpenUI rendering message bus and streams events from there — no instrumentation in your own components.",
    code: `import * as Observability from "@openuidev/observability-cloud";

Observability.init({ apiKey: "pk-th-…" });`,
    highlight: [2],
  },
];

export function IntegrateSection() {
  return (
    <section className={styles.section} aria-labelledby="observability-integrate">
      <h2 id="observability-integrate" className={styles.heading}>
        Two lines in your layout
      </h2>
      <p className={styles.lead}>
        There is no agent framework to adopt and no backend to change. Observability reads what
        OpenUI already emits while it renders.
      </p>

      <ol className={styles.steps}>
        {STEPS.map((step) => (
          <li className={styles.step} key={step.title}>
            <div className={styles.stepHead}>
              <span className={styles.term}>
                {step.href ? (
                  <a
                    className={styles.termLink}
                    href={step.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {step.title}
                  </a>
                ) : (
                  step.title
                )}
              </span>
              <p className={styles.desc}>{step.description}</p>
            </div>
            {step.code ? (
              <div className={styles.stepCode}>
                <CloudCodeBlock code={step.code} highlightLines={step.highlight} />
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
