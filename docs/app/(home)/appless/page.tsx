import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { CloudCtaSection } from "../cloud/CloudCtaSection";
import { BevelButton } from "../components/Button/BevelButton";
import { InsightBar } from "../components/InsightBar/InsightBar";
import styles from "../components/ProductLanding.module.css";
import homeStyles from "../page.module.css";
import type { GridFeature } from "../sections/FeatureGridSection/FeatureGridSection";
import { FeatureGridSection } from "../sections/FeatureGridSection/FeatureGridSection";
import { Footer } from "../sections/Footer/Footer";
import { HeroSection } from "../sections/HeroSection/HeroSection";
import { AppLessDemo } from "./AppLessDemo";

export const metadata: Metadata = {
  title: "AppLess | What if your phone had no apps?",
  description:
    "Ask for what you need. AppLess generates a native interface for the task, then builds the next screen when you tap.",
  alternates: { canonical: "/appless" },
  openGraph: {
    title: "AppLess | What if your phone had no apps?",
    description:
      "An open-source experiment that generates native interfaces around the task at hand.",
    url: "/appless",
    type: "website",
  },
};

const github = "https://github.com/thesysdev/appless";

const features: GridFeature[] = [
  {
    icon: "search",
    title: "Just ask",
    description:
      "Describe the interface you need, from a weather dashboard or restaurant list to a booking form. AppLess generates the screen on demand.",
  },
  {
    icon: "devices",
    title: "Native on each platform",
    description:
      "OpenUI renders the same generated screen with Cupertino components on iOS and Material 3 components on Android.",
  },
  {
    icon: "interaction",
    title: "Keep exploring",
    description:
      "Tap a row, button, or card to request the next screen. Optional prefetch trades extra model requests for faster navigation.",
  },
];

export default function AppLessPage() {
  const preview = <AppLessDemo />;

  return (
    <div className={`${homeStyles.page} ${styles.sectionRhythm}`}>
      <div className={homeStyles.heroShell}>
        <HeroSection
          align="left"
          desktopFromTablet
          title={
            <span className={styles.titleBlock}>
              <span className={styles.eyebrow}>AppLess</span>
              <span className={styles.title}>What if your phone had no apps?</span>
            </span>
          }
          subtitle={
            <span className={styles.subtitle}>
              Ask for what you need. AppLess generates a native interface for the task, then builds
              the next screen when you tap.
            </span>
          }
          smallSubtitle
          tightDesktopSpacing={false}
          splitLockup
          flushInnerInlinePadding
          commandSlot={
            <div className={styles.ctaGroup}>
              <BevelButton
                href={github}
                external
                variant="primary"
                label="Explore on GitHub"
                badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
              />
            </div>
          }
          showPlaygroundButton={false}
          showGitHubBanner={false}
          showTagline={false}
          desktopPreviewSlot={preview}
          mobilePreviewSlot={preview}
        />
      </div>

      <main className={styles.main}>
        <section className={styles.contentSection} aria-labelledby="appless-interface-heading">
          <div className={styles.sectionHeader}>
            <h2 id="appless-interface-heading">An interface for whatever you have in mind</h2>
            <p>
              Ask for a task, use the native interface it creates, then keep moving as AppLess
              generates the next screen.
            </p>
          </div>
          <FeatureGridSection
            features={features}
            showHeader={false}
            showCompat={false}
            showBottomSeparator={false}
            showTopSeparator
            flushSectionPadding
            mobileAccordion={false}
          />
          <div className={styles.mechanismBlock}>
            <div className={styles.sectionHeader}>
              <h2 id="appless-powered-heading">Powered by OUI-1 and OpenUI</h2>
              <p>
                OUI-1 generates the interface in OpenUI Lang. OpenUI validates and renders it into
                native components as the response arrives.
              </p>
            </div>
            <div className={styles.linkRow}>
              <BevelButton
                href="/oui-1"
                variant="secondary"
                label="Meet OUI-1"
                badge={<ArrowRight size={16} strokeWidth={2.25} />}
              />
              <BevelButton
                href="/docs/openui-lang"
                variant="secondary"
                label="Explore OpenUI Lang"
                badge={<ArrowRight size={16} strokeWidth={2.25} />}
              />
            </div>
          </div>
        </section>

        <section className={styles.softBand} aria-labelledby="appless-future-heading">
          <div className={styles.bandInner}>
            <div className={styles.sectionHeader}>
              <h2 id="appless-future-heading">A glimpse of what comes next</h2>
              <p>
                AppLess is an open-source experiment in software that forms around the task, then
                changes as the task evolves.
              </p>
            </div>
            <InsightBar>
              Bookings, purchases, and payments in the demo are simulated. Optional search can
              ground generated content in live results.
            </InsightBar>
          </div>
        </section>

        <CloudCtaSection
          title="Make it your own."
          primary={{ label: "Explore on GitHub", href: github, external: true }}
          secondary={{ label: "Meet OUI-1", href: "/oui-1" }}
        />
      </main>
      <Footer />
    </div>
  );
}
