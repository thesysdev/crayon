import { CloudIntegrationSetup, type CloudIntegrationStep } from "../CloudIntegrationSection";
import styles from "./page.module.css";

/* Two steps, each with the change it describes beside it — the same shape as the
   Gateway page's stepper. Verified against packages/observability-cloud: the
   package name, `init`, and the `pk-th-…` key format all come from
   CloudObservabilityOptions rather than from the brief, which named the package
   two different ways. */
const OBSERVABILITY_EXAMPLE = `import * as Observability from "@openuidev/observability-cloud";

Observability.init({ apiKey: "pk-th-…" });`;

const STEPS: CloudIntegrationStep[] = [
  {
    title: "Generate a frontend API key",
    description:
      "Create a publishable key in the OpenUI console. It’s safe to use in browser code.",
    href: "https://console.thesys.dev/client-api-keys",
    code: OBSERVABILITY_EXAMPLE,
    highlightLines: [2],
  },
  {
    title: "Initialize the SDK",
    description:
      "Add it once in your root layout to collect OpenUI render events. No tracking code needed in your components.",
    code: OBSERVABILITY_EXAMPLE,
    highlightLines: [0, 2],
  },
];

export function IntegrateSection() {
  return (
    <section className={styles.integrationSection} aria-labelledby="observability-integrate">
      <CloudIntegrationSetup
        title="Set up in two lines"
        titleId="observability-integrate"
        description="Keep your agent framework and backend. The SDK captures events OpenUI already emits as it renders."
        steps={STEPS}
        code={OBSERVABILITY_EXAMPLE}
        codeLabel="OpenUI Observability client configuration"
        titleSize="medium"
      />
    </section>
  );
}
