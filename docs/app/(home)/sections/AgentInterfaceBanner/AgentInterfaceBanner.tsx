import { ArrowRight } from "lucide-react";
import { PillLink } from "../../components/Button/Button";
import styles from "./AgentInterfaceBanner.module.css";

export function AgentInterfaceBanner() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.copy}>
          <h2 className={styles.title}>Start with a production-ready interface</h2>
          <p className={styles.description}>
            Ship a complete AI-native workspace on top of OpenUI, with conversations, Generative
            UI, artifacts, and actions ready out of the box.
          </p>
          <PillLink
            variant="primary"
            fullWidthMobile
            href="/agent-interface"
            arrow={
              <ArrowRight
                aria-hidden="true"
                className={styles.ctaArrow}
                size={18}
                strokeWidth={2}
              />
            }
          >
            Explore Agent Interface
          </PillLink>
        </div>
        <div className={styles.media} aria-hidden="true">
          <div className={styles.mediaFrame}>
            <img
              alt=""
              className={styles.mediaImage}
              decoding="async"
              loading="lazy"
              src="/agent-interface/agentinterfacehero.svg"
              width={1516}
              height={961}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
