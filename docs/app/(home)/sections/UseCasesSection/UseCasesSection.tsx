import { AgentSteps } from "../../agent-interface/AgentSteps";
import { SectionHeader } from "../../components/SectionHeader/SectionHeader";
import styles from "./UseCasesSection.module.css";

/* Anchor: the CloudBanner waits for this section before appearing. */
export const USE_CASES_SECTION_ID = "use-cases";

export function UseCasesSection() {
  return (
    <section id={USE_CASES_SECTION_ID} className={styles.useCases}>
      <div className={styles.header}>
        <SectionHeader title="Generative UI for every use case">
          <p className={styles.description}>
            From dashboards to support to dev tools, OpenUI renders the
            interface your users need.
          </p>
        </SectionHeader>
      </div>
      <AgentSteps autoAdvance variant="useCases" />
    </section>
  );
}
