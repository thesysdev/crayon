import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { CloudCtaSection } from "../cloud/CloudCtaSection";
import gatewayStyles from "../cloud/gateway/page.module.css";
import { BevelButton } from "../components/Button/BevelButton";
import { FadedDither } from "../components/FadedDither/FadedDither";
import styles from "../components/ProductLanding.module.css";
import { SectionHeader } from "../components/SectionHeader/SectionHeader";
import homeStyles from "../page.module.css";
import { AutofixSection } from "../sections/AutofixSection/AutofixSection";
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
    <div className={`${gatewayStyles.heroArtSpace} ${styles.appDemoStage}`}>
      <FadedDither band="light" className={gatewayStyles.heroShader} />
      <div className={gatewayStyles.heroArtwork}>
        <AppLessDemo />
      </div>
    </div>
  );
  return (
    <div className={`${homeStyles.page} ${styles.pageFocus} ${styles.applessPage}`}>
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
            <span className={`${gatewayStyles.subtitle} ${styles.heroSubtitle}`}>
              Ask for what you need. AppLess creates a native interface for the task, then builds
              the next screen when you tap.
            </span>
          }
          commandSlot={
            <div className={`${gatewayStyles.ctaGroup} ${styles.appHeroActions}`}>
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
        <div className={styles.poweredBanner}>
          <AutofixSection
            actionOnRight
            content={{
              title: <>Powered by OUI-1 and OpenUI</>,
              description: (
                <>
                  OUI-1 generates the interface in OpenUI Lang. OpenUI renders it into native
                  components as it streams.
                </>
              ),
              action: { label: "Meet OUI-1", href: "/oui-1" },
            }}
          />
        </div>
        <CloudCtaSection
          className={styles.closingCta}
          title="A glimpse of what comes next"
          description={
            <>
              <p>
                AppLess explores a future where software takes shape around your intent. It’s an
                open-source experiment you can fork, extend, and connect to real services.
              </p>
              <p>
                Today, bookings, purchases, and payments are simulated. Optional search tools can
                ground screen content in real information.
              </p>
            </>
          }
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
