import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { CloudCtaSection } from "../cloud/CloudCtaSection";
import gatewayStyles from "../cloud/gateway/page.module.css";
import { BevelButton } from "../components/Button/BevelButton";
import { FadedDither } from "../components/FadedDither/FadedDither";
import styles from "../components/ProductLanding.module.css";
import { SectionHeader } from "../components/SectionHeader/SectionHeader";
import homeStyles from "../page.module.css";
import { FeatureGridSection } from "../sections/FeatureGridSection/FeatureGridSection";
import { Footer } from "../sections/Footer/Footer";
import { HeroSection } from "../sections/HeroSection/HeroSection";
import { OuiFlare } from "./OuiFlare";

export const metadata: Metadata = {
  title: "OUI-1 | An open model built for Generative UI",
  description:
    "A DiffusionGemma finetune that writes OpenUI Lang, with 4B active parameters, a 71.7% Generative UI Benchmark score, and Apache 2.0 weights.",
  alternates: { canonical: "/oui-1" },
  openGraph: {
    title: "OUI-1 | An open model built for Generative UI",
    description:
      "Generate interfaces from your components with an open-weight model built for OpenUI Lang.",
    url: "/oui-1",
    type: "website",
  },
};
const model = "https://huggingface.co/thesysdev/OUI-1";
const research = "/blog/oui-1";
export default function OuiOnePage() {
  const artwork = (
    <div className={`${gatewayStyles.heroArtSpace} ${styles.ouiArtStage}`}>
      <FadedDither band="light" className={gatewayStyles.heroShader} />
      <div className={gatewayStyles.heroArtwork}>
        <OuiFlare />
      </div>
    </div>
  );
  return (
    <div className={`${homeStyles.page} ${styles.pageFocus} ${styles.ouiPage}`}>
      <div className={homeStyles.heroShell}>
        <HeroSection
          align="left"
          desktopFromTablet
          smallSubtitle
          tightDesktopSpacing={false}
          splitLockup
          flushInnerInlinePadding
          title={
            <span className={gatewayStyles.titleBlock}>
              <span className={gatewayStyles.eyebrow}>OpenUI OUI-1</span>
              <span className={gatewayStyles.title}>An open model built for Generative UI</span>
            </span>
          }
          subtitle={
            <span className={`${gatewayStyles.subtitle} ${styles.heroSubtitle}`}>
              Generate interfaces from your own components.{" "}
              <span className={styles.noWrap}>OUI-1</span> writes{" "}
              <span className={styles.noWrap}>OpenUI Lang,</span> ready to render as it streams.
            </span>
          }
          commandSlot={
            <div className={gatewayStyles.ctaGroup}>
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
                badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
              />
            </div>
          }
          showPlaygroundButton={false}
          showGitHubBanner={false}
          showTagline={false}
          desktopPreviewSlot={artwork}
          mobilePreviewSlot={artwork}
        />
      </div>
      <main>
        <div className={styles.featuresBand}>
          <div className={styles.featuresInner}>
            <div className={styles.featureHeading}>
              <SectionHeader title="Built for interfaces, ready for your product" />
            </div>
            <FeatureGridSection
              showHeader={false}
              showCompat={false}
              showBottomSeparator={false}
              fadeColumnLines
              flushSectionPadding
              mobileAccordion={false}
              features={[
                {
                  icon: "pulse",
                  title: "4B active parameters",
                  description:
                    "A compact model purpose-built for Generative UI, with 26B total parameters.",
                },
                {
                  icon: "chart",
                  title: "71.7% benchmark score",
                  description: "5.5× its base model’s score on the Generative UI Benchmark.",
                },
                {
                  icon: "signal",
                  title: "Streams as it generates",
                  description:
                    "OpenUI renders complete components as the response arrives, so the interface takes shape as it’s generated.",
                },
                {
                  icon: "interaction",
                  title: "Your components, generated",
                  description:
                    "Describe your component library. OUI-1 composes it into interfaces using OpenUI Lang.",
                },
                {
                  icon: "devices",
                  title: "Run on your own hardware",
                  description:
                    "Self-host on a compatible GPU. The AppLess setup documents FP8 inference on an RTX 5090.",
                },
                {
                  icon: "key",
                  title: "Open weights, Apache 2.0",
                  description:
                    "Download the weights, adapt the model, and build with your own component library.",
                },
              ]}
            />
          </div>
        </div>
        <CloudCtaSection
          className={`${styles.closingCta} ${styles.ouiClosing}`}
          title="Build your next interface with OUI-1."
          primary={{ label: "Get the model", href: model, external: true }}
          secondary={{ label: "Read the research", href: research }}
        />
      </main>
      <Footer />
    </div>
  );
}
