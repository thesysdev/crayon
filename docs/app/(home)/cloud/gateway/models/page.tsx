import { BevelButton } from "@/app/(home)/components/Button/BevelButton";
import { PageHero } from "@/app/(home)/components/PageHero/PageHero";
import { Footer } from "@/app/(home)/sections/Footer/Footer";
import { createPageMetadata } from "@/lib/page-metadata";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import page from "./metadata";
import { FreeModelsTable, ModelsTable } from "./ModelsTable";
import styles from "./page.module.css";

export const metadata = createPageMetadata(page);

const PROVIDER_SECTIONS = [
  { group: "openai", title: "OpenAI" },
  { group: "anthropic", title: "Anthropic" },
  { group: "gemini", title: "Gemini" },
] as const;

export default function GatewayModelsPage() {
  return (
    <main className={styles.page}>
      <PageHero
        eyebrow="OpenUI Gateway"
        title="Models"
        subtitle="Models you can call through OpenUI Gateway."
        smallSubtitle
        actions={
          <BevelButton
            variant="secondary"
            href="/docs/gateway/models"
            label="View docs"
            badge={<ArrowRight size={16} weight="bold" />}
          />
        }
      />

      <div className={styles.content}>
        <section className={styles.section}>
          <header className={styles.sectionHeader}>
            <h2>Free models</h2>
            <p>
              These models are promotionally free. Gateway does not charge for their tokens, but
              each request still uses an API call from your plan. Free models are rate limited, and
              each organization has a limited usage quota for them. Request data for free models may
              be used for training.
            </p>
          </header>
          <FreeModelsTable />
        </section>

        {PROVIDER_SECTIONS.map((p) => (
          <section className={styles.section} key={p.group}>
            <header className={styles.sectionHeader}>
              <h2>{p.title}</h2>
            </header>
            <ModelsTable group={p.group} preview={5} pageSize={15} />
          </section>
        ))}

        <section className={styles.section}>
          <header className={styles.sectionHeader}>
            <h2>Other models</h2>
            <p>
              OpenUI Gateway serves third-party models from providers other than OpenAI, Anthropic,
              and Google Gemini through OpenRouter. To require{" "}
              <a
                href="https://openrouter.ai/docs/guides/features/zdr"
                target="_blank"
                rel="noopener noreferrer"
              >
                Zero Data Retention (ZDR)
              </a>{" "}
              endpoints, select or exclude providers, or set other routing preferences, use the{" "}
              <Link href="/docs/gateway/models#provider-routing">
                <code>provider</code> object
              </Link>
              .
            </p>
          </header>
          <ModelsTable group="other" />
        </section>
      </div>

      <Footer />
    </main>
  );
}
