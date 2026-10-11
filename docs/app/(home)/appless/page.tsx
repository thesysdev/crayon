import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CloudCtaSection } from "../cloud/CloudCtaSection";
import gatewayStyles from "../cloud/gateway/page.module.css";
import { BevelButton } from "../components/Button/BevelButton";
import styles from "../components/ProductLanding.module.css";
import { SectionHeader } from "../components/SectionHeader/SectionHeader";
import homeStyles from "../page.module.css";
import { FeatureGridSection } from "../sections/FeatureGridSection/FeatureGridSection";
import { Footer } from "../sections/Footer/Footer";
import { HeroSection } from "../sections/HeroSection/HeroSection";
import { AppLessDemo } from "./AppLessDemo";

export const metadata: Metadata = {
  title: "AppLess | What if your phone had no apps?",
  description:
    "Ask for what you need. AppLess creates a native interface for the task, then builds the next screen when you tap.",
  alternates: { canonical: "/appless" },
  openGraph: {
    title: "AppLess | What if your phone had no apps?",
    description: "An open-source experiment in native interfaces generated around your intent.",
    url: "/appless",
    type: "website",
  },
};
const github = "https://github.com/thesysdev/appless";
export default function AppLessPage() {
  const demo = (
    <div className={`${gatewayStyles.heroArtSpace} ${styles.stage}`}>
      <AppLessDemo />
    </div>
  );
  return (
    <div className={`${homeStyles.page} ${styles.pageFocus}`}>
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
              <span className={gatewayStyles.eyebrow}>AppLess</span>
              <span className={gatewayStyles.title}>What if your phone had no apps?</span>
            </span>
          }
          subtitle={
            <span className={gatewayStyles.subtitle}>
              Ask for what you need. AppLess creates a native interface for the task, then builds
              the next screen when you tap.
            </span>
          }
          commandSlot={
            <div className={gatewayStyles.ctaGroup}>
              <BevelButton
                href={github}
                external
                variant="primary"
                label="Explore GitHub"
                badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
              />
            </div>
          }
          showPlaygroundButton={false}
          showGitHubBanner={false}
          showTagline={false}
          desktopPreviewSlot={demo}
          mobilePreviewSlot={demo}
        />
        <p className={styles.disclosure}>
          A replay of the presentation demo, rendered from OpenUI Lang. Orders and payments are
          simulated.
        </p>
      </div>
      <main>
        <div className={styles.featuresBand}>
          <div className={styles.featuresInner}>
            <div className={styles.featureHeading}>
              <SectionHeader title="From a request to a native interface" />
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
                  icon: "interaction",
                  title: "Just ask",
                  description:
                    "From a weather dashboard to a booking form, describe the task and watch the screen appear.",
                },
                {
                  icon: "devices",
                  title: "Native on your phone",
                  description:
                    "Interactive components render as Cupertino on iOS and Material 3 on Android.",
                },
                {
                  icon: "refresh",
                  title: "Keep exploring",
                  description:
                    "Tap a row, button, or card to generate the next screen. Optional prefetch makes likely destinations ready sooner.",
                },
              ]}
            />
          </div>
        </div>
        <section className={styles.powered} aria-labelledby="appless-powered">
          <h2 id="appless-powered">Powered by OUI-1 and OpenUI</h2>
          <div>
            <p>
              OUI-1 generates the interface in OpenUI Lang. OpenUI renders it into native components
              as it streams.
            </p>
            <div className={styles.textLinks}>
              <Link href="/oui-1">
                Meet OUI-1 <ArrowRight size={16} />
              </Link>
              <Link href="/docs/openui-lang">
                Explore OpenUI Lang <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
        <CloudCtaSection
          title="Make AppLess your own."
          primary={{ label: "Explore GitHub", href: github, external: true }}
          secondary={{
            label: "Read the setup guide",
            href: github + "#quick-start",
            external: true,
          }}
        />
      </main>
      <Footer />
    </div>
  );
}
