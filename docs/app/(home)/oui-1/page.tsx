import { DgScoreboard } from "@/components/charts/diffusion-charts";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { BevelButton } from "../components/Button/BevelButton";
import styles from "../components/ProductLanding.module.css";
import { Footer } from "../sections/Footer/Footer";
import { OuiComparison } from "./OuiComparison";

export const metadata: Metadata = {
  title: "OUI-1 | An open-weight model for Generative UI",
  description:
    "A DiffusionGemma 26B-A4B finetune that writes OpenUI Lang, with 4B active parameters, a 71.7% Generative UI Benchmark score, and Apache 2.0 weights.",
  alternates: { canonical: "/oui-1" },
  openGraph: {
    title: "OUI-1 | An open-weight model for Generative UI",
    description: "A DiffusionGemma 26B-A4B finetune built to generate interfaces in OpenUI Lang.",
    url: "/oui-1",
    type: "website",
  },
};

const model = "https://huggingface.co/thesysdev/OUI-1";
const research = "/blog/oui-1";

const facts = [
  {
    title: "256-token blocks",
    body: "OUI-1 generates in blocks while OpenUI renders complete component lines as the response arrives.",
  },
  {
    title: "Measured latency",
    body: "With vLLM 0.24 and FP8 on one A100 80GB, one request at a time, a light screen took about one second and a dense screen took three to six seconds.",
  },
  {
    title: "Self-host on compatible GPUs",
    body: "FP8 weights occupy about 25.8 GiB before runtime and cache memory. The AppLess setup documents an RTX 5090 configuration.",
  },
  {
    title: "Apache 2.0",
    body: "Download the weights, adapt the model, and run it with your own OpenUI component library.",
  },
];

function Actions() {
  return (
    <div className={styles.actions}>
      <BevelButton
        href={model}
        external
        variant="primary"
        label="Get the model"
        badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
      />
      <BevelButton
        href={research}
        variant="secondary"
        label="Read the technical report"
        badge={<ArrowRight size={16} strokeWidth={2.25} />}
      />
    </div>
  );
}

export default function OuiOnePage() {
  return (
    <div className={styles.page}>
      <main>
        <section className={`${styles.shell} ${styles.ouiHero}`}>
          <div className={styles.heroCopyWide}>
            <p className={styles.productName}>OpenUI OUI-1</p>
            <h1 className={styles.heroTitle}>An open-weight model for Generative UI</h1>
            <p className={styles.heroLead}>
              Give OUI-1 a plain-language brief and your component signatures. It returns an OpenUI
              Lang screen that your application can validate and render.
            </p>
            <Actions />
          </div>
          <div className={styles.heroFacts} aria-label="OUI-1 summary">
            <div>
              <strong>26B</strong>
              <span>total parameters</span>
            </div>
            <div>
              <strong>4B</strong>
              <span>active parameters</span>
            </div>
            <div>
              <strong>71.7%</strong>
              <span>benchmark score</span>
            </div>
          </div>
        </section>

        <section className={`${styles.shell} ${styles.comparisonSection}`}>
          <OuiComparison />
        </section>

        <section className={styles.softBand}>
          <div className={`${styles.shell} ${styles.ouiIntro}`}>
            <div className={styles.sectionHeader}>
              <h2>Built for OpenUI Lang</h2>
              <p>
                OUI-1 finetunes DiffusionGemma 26B-A4B to compose interfaces from the components
                your application makes available.
              </p>
            </div>
            <div className={styles.proofText}>
              <p>
                On the Generative UI Benchmark, OUI-1 produced 132 valid outputs across 184 runs.
                Base DiffusionGemma produced 24, or 13.0%.
              </p>
              <p>
                Across 60 held-out AppLess asks, OUI-1 produced 55 valid outputs, compared with 23
                from the base model.
              </p>
            </div>
          </div>
        </section>

        <section className={`${styles.shell} ${styles.benchmarkSection}`}>
          <div className={styles.sectionHeader}>
            <h2>Measured quality at 4B active parameters</h2>
            <p>
              The comparison below covers open-weight models with up to 31B active parameters. The
              full data remains available in the chart disclosure.
            </p>
          </div>
          <div className={styles.chartFrame}>
            <DgScoreboard />
          </div>
        </section>

        <section className={`${styles.shell} ${styles.section}`}>
          <div className={styles.sectionHeader}>
            <h2>What it takes to run</h2>
            <p>
              OUI-1 is open and self-hostable, with deployment details stated alongside the
              performance claims they qualify.
            </p>
          </div>
          <div className={styles.factGrid}>
            {facts.map((fact) => (
              <article className={styles.fact} key={fact.title}>
                <h3>{fact.title}</h3>
                <p>{fact.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.shell} ${styles.bridgeSection}`}>
          <div>
            <p className={styles.productName}>Now powering AppLess</p>
            <h2>See OUI-1 generate native phone interfaces</h2>
          </div>
          <BevelButton
            href="/appless"
            variant="secondary"
            label="Explore AppLess"
            badge={<ArrowRight size={16} strokeWidth={2.25} />}
          />
        </section>

        <section className={`${styles.shell} ${styles.closing}`}>
          <div>
            <h2>Build with OUI-1</h2>
            <p>
              Use the published model with an OpenUI component contract, then validate and render
              its OpenUI Lang output in your application.
            </p>
          </div>
          <Actions />
        </section>
      </main>
      <Footer />
    </div>
  );
}
