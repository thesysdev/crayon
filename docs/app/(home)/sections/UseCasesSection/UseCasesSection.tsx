import { AgentSteps } from "../../agent-interface/AgentSteps";
import { SectionHeader } from "../../components/SectionHeader/SectionHeader";
import styles from "./UseCasesSection.module.css";

export function UseCasesSection() {
  return (
    <section className={styles.useCases}>
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
