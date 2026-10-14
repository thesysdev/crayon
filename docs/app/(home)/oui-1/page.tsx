import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { CloudCtaSection } from "../cloud/CloudCtaSection";
import { BevelButton } from "../components/Button/BevelButton";
import styles from "../components/ProductLanding.module.css";
import homeStyles from "../page.module.css";
import type { GridFeature } from "../sections/FeatureGridSection/FeatureGridSection";
import { FeatureGridSection } from "../sections/FeatureGridSection/FeatureGridSection";
import { Footer } from "../sections/Footer/Footer";
import { HeroSection } from "../sections/HeroSection/HeroSection";

export const metadata: Metadata = {
  title: "OUI-1 | An open model for real-time Generative UI",
  description:
    "A DiffusionGemma 26B-A4B finetune that writes OpenUI Lang, with 4B active parameters, a 71.7% Generative UI Benchmark score, and Apache 2.0 weights.",
  alternates: { canonical: "/oui-1" },
  openGraph: {
    title: "OUI-1 | An open model for real-time Generative UI",
    description: "A DiffusionGemma 26B-A4B finetune built to generate interfaces in OpenUI Lang.",
    url: "/oui-1",
    type: "website",
  },
};

const model = "https://huggingface.co/thesysdev/OUI-1";
const research = "/blog/oui-1";

const facts: GridFeature[] = [
  {
    icon: "interaction",
    title: "Built for responsive interfaces",
    description: "Generates interactive interfaces in OpenUI Lang from your component signatures.",
  },
  {
    icon: "devices",
    title: "Self-host on compatible GPUs",
    description: "The published AppLess setup documents an FP8 configuration on an RTX 5090.",
  },
  {
    icon: "pulse",
    title: "4B active parameters",
    description: "A 26B-total DiffusionGemma finetune with 4B parameters active during generation.",
  },
  {
    icon: "chart",
    title: "71.7% benchmark score",
    description: "OUI-1 produced 132 valid outputs across 184 Generative UI Benchmark runs.",
  },
  {
    icon: "signal",
    title: "Streams as it generates",
    description: "OpenUI renders complete component lines as the model response arrives.",
  },
  {
    icon: "shield",
    title: "Open weights, Apache 2.0",
    description:
      "Download the weights, adapt the model, and use your own OpenUI component library.",
  },
];

function Actions() {
  return (
    <div className={styles.ctaGroup}>
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
        label="Read the research"
        badge={<ArrowRight size={16} strokeWidth={2.25} />}
      />
    </div>
  );
}

export default function OuiOnePage() {
  return (
    <div className={`${homeStyles.page} ${styles.sectionRhythm}`}>
      <div className={homeStyles.heroShell}>
        <HeroSection
          align="left"
          desktopFromTablet
          title={
            <span className={styles.titleBlock}>
              <span className={styles.eyebrow}>
                OpenUI <span className={styles.productTag}>OUI-1</span>
              </span>
              <span className={styles.title}>An open model for real-time Generative UI</span>
            </span>
          }
          subtitle={
            <span className={styles.subtitle}>
              Give OUI-1 a plain-language brief and your component signatures. It returns an OpenUI
              Lang screen that your application can validate and render.
            </span>
          }
          smallSubtitle
          tightDesktopSpacing={false}
          splitLockup
          flushInnerInlinePadding
          commandSlot={<Actions />}
          showPlaygroundButton={false}
          showGitHubBanner={false}
          showPreview={false}
          showTagline={false}
        />
      </div>

      <main className={styles.main}>
        <section className={styles.softBand} aria-labelledby="oui-built-heading">
          <div className={styles.bandInner}>
            <div className={styles.sectionHeader}>
              <h2 id="oui-built-heading">Generative UI at the speed of interaction</h2>
              <p>
                OUI-1 is a DiffusionGemma 26B-A4B finetune for OpenUI Lang. The direction is lower
                latency without giving up model quality or open deployment.
              </p>
            </div>
            <FeatureGridSection
              features={facts}
              showHeader={false}
              showCompat={false}
              showBottomSeparator={false}
              showTopSeparator
              flushSectionPadding
              mobileAccordion={false}
            />
          </div>
        </section>

        <CloudCtaSection
          title="Build the next generation of intelligent software."
          primary={{ label: "Get the model", href: model, external: true }}
          secondary={{ label: "Read the research", href: research }}
        />
      </main>
      <Footer />
    </div>
  );
}
