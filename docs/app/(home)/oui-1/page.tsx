import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BevelButton } from "../components/Button/BevelButton";
import styles from "../components/ProductLanding.module.css";
import { Footer } from "../sections/Footer/Footer";

export const metadata: Metadata = {
  title: "OUI-1 | An open model built for Generative UI",
  description:
    "A DiffusionGemma 26B-A4B finetune that writes OpenUI Lang, with 4B active parameters, a 71.7% Generative UI Benchmark score, and Apache 2.0 weights.",
  alternates: { canonical: "/oui-1" },
  openGraph: {
    title: "OUI-1 | An open model built for Generative UI",
    description: "A DiffusionGemma 26B-A4B finetune built to generate interfaces in OpenUI Lang.",
    url: "/oui-1",
    type: "website",
  },
};

const model = "https://huggingface.co/thesysdev/OUI-1";
const research = "/blog/oui-1";
const facts = [
  {
    title: "4B active parameters",
    description: "A compact model purpose-built for Generative UI, with 26B total parameters.",
  },
  {
    title: "71.7% benchmark score",
    description: "5.5× its base model’s score on the Generative UI Benchmark.",
  },
  {
    title: "Streams as it generates",
    description:
      "OpenUI renders complete components as the response arrives, so the interface takes shape as it’s generated.",
  },
  {
    title: "Your components, generated",
    description:
      "Describe your component library. OUI-1 composes it into interfaces using OpenUI Lang.",
  },
  {
    title: "Run on your own hardware",
    description:
      "Self-host on a compatible GPU. The AppLess setup documents FP8 inference on an RTX 5090.",
  },
  {
    title: "Open weights, Apache 2.0",
    description:
      "Download the weights, adapt the model, and build with your own component library.",
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
        badge={<ArrowUpRight size={16} />}
      />
      <Link className={styles.textAction} href={research}>
        Read the research <ArrowRight size={16} />
      </Link>
    </div>
  );
}
export default function OuiOnePage() {
  return (
    <div className={styles.page}>
      <main className={styles.container}>
        <section className={styles.modelHero} aria-labelledby="oui-title">
          <p className={styles.eyebrow}>OpenUI OUI-1</p>
          <h1 id="oui-title">An open model built for Generative UI</h1>
          <p className={styles.lead}>
            Turn requests into interfaces built from your components. OUI-1 writes OpenUI Lang,
            ready for OpenUI to render as it arrives.
          </p>
          <Actions />
          <div className={styles.modelArtwork} role="img" aria-label="OUI-1">
            <div className={styles.modelDots} />
            <span>OUI-1</span>
          </div>
        </section>
        <section className={styles.section} aria-labelledby="oui-features">
          <h2 id="oui-features" className={styles.sectionTitle}>
            Built for interfaces, ready for your product
          </h2>
          <p className={styles.sectionIntro}>
            A model trained to compose interfaces, with open weights you can run and adapt yourself.
          </p>
          <div className={styles.featureGrid}>
            {facts.map((fact) => (
              <article className={styles.feature} key={fact.title}>
                <h3>{fact.title}</h3>
                <p>{fact.description}</p>
              </article>
            ))}
          </div>
        </section>
        <section className={styles.closing} aria-labelledby="oui-build">
          <h2 id="oui-build">Give your product a model that speaks UI</h2>
          <p className={styles.closingLead}>
            Download OUI-1 and start generating interfaces with your own component library.
          </p>
          <Actions />
        </section>
      </main>
      <Footer />
    </div>
  );
}
