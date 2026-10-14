import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { BevelButton } from "../components/Button/BevelButton";
import styles from "./CloudCtaSection.module.css";

interface CtaAction {
  label: string;
  href: string;
  external?: boolean;
}

export function CloudCtaSection({
  className,
  description,
  title = "Turn your OpenUI application into a production-grade experience.",
  primary = { label: "Get API key", href: "https://console.thesys.dev/keys", external: true },
  secondary = { label: "Book a demo", href: "https://zcal.co/t/thesys/demo", external: true },
}: {
  className?: string;
  description?: ReactNode;
  title?: string;
  primary?: CtaAction;
  secondary?: CtaAction;
} = {}) {
  const actions = (
    <div className={styles.actions}>
      <BevelButton
        href={primary.href}
        external={primary.external}
        variant="primary"
        label={primary.label}
        badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
      />
      <BevelButton
        href={secondary.href}
        external={secondary.external}
        variant="secondary"
        label={secondary.label}
        badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
      />
    </div>
  );
  return (
    <section
      className={`${styles.section} ${description ? styles.withDescription : ""} ${className ?? ""}`}
      aria-labelledby="cloud-cta-title"
    >
      <div className={styles.inner}>
        {description ? (
          <>
            <div className={styles.copy}>
              <h2 id="cloud-cta-title" className={styles.title}>
                {title}
              </h2>
              {actions}
            </div>
            <div className={styles.description}>{description}</div>
          </>
        ) : (
          <>
            <h2 id="cloud-cta-title" className={styles.title}>
              {title}
            </h2>
            {actions}
          </>
        )}
      </div>
      <div className={styles.separator} aria-hidden="true" />
    </section>
  );
}
