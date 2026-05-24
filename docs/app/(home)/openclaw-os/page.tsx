import type { Metadata } from "next";
import styles from "../page.module.css";
import { FeaturesSection, OPENCLAW_FEATURES } from "../sections/FeaturesSection/FeaturesSection";
import { Footer } from "../sections/Footer/Footer";
import { GradientDivider } from "../sections/GradientDivider/GradientDivider";
import { HeroSection } from "../sections/HeroSection/HeroSection";
import heroStyles from "../sections/HeroSection/HeroSection.module.css";
import { PossibilitiesSection } from "../sections/PossibilitiesSection/PossibilitiesSection";
import { StuckInChatSection } from "../sections/StuckInChatSection/StuckInChatSection";

const INSTALL_COMMAND = "curl -fsSL https://openui.com/openclaw-os/install.sh | bash";
const WINDOWS_INSTALL_COMMAND =
  'powershell -c "irm https://openui.com/openclaw-os/install.ps1 | iex"';

export const metadata: Metadata = {
  title: "OpenClaw OS - The Default Workspace for OpenClaw",
  description:
    "OpenClaw OS is the default workspace for OpenClaw. Generate interactive apps and artifacts instantly for any use case, always updated with live data.",
  alternates: { canonical: "/openclaw-os" },
  openGraph: {
    title: "OpenClaw OS — The Default Workspace for OpenClaw",
    description:
      "The default workspace for OpenClaw. Generate interactive apps and artifacts instantly, always updated with live data.",
    url: "/openclaw-os",
    type: "website",
  },
  twitter: {
    title: "OpenClaw OS — The Default Workspace for OpenClaw",
    description:
      "The default workspace for OpenClaw. Generate interactive apps and artifacts instantly, always updated with live data.",
    card: "summary_large_image",
  },
};

export default function OpenClawOSPage() {
  return (
    <div className={styles.page}>
      <div className={styles.heroShell}>
        <HeroSection
          title={
            <>
              OpenClaw <span className={heroStyles.titleAccent}>OS</span>
            </>
          }
          subtitle={
            <>
              The Default workspace for{" "}
              <span className={heroStyles.subtitleLogoTile} aria-hidden="true">
                <img src="/openclaw-dark.svg" alt="" />
              </span>
              OpenClaw.
            </>
          }
          command={INSTALL_COMMAND}
          commandLabel="macOS / Linux"
          secondaryCommand={WINDOWS_INSTALL_COMMAND}
          secondaryCommandLabel="Windows PowerShell"
          compact
          showBanner={false}
          showPlaygroundButton={false}
          desktopPreviewImage="/OpenclawOS-hero1.png"
          desktopPreviewImageAlt="OpenClaw OS desktop preview"
          desktopPreviewImageWidth={3200}
          desktopPreviewImageHeight={1036}
          mobilePreviewImage="/openclaw-os-mobile-hero.png"
          mobilePreviewImageAlt="OpenClaw OS mobile preview"
          mobilePreviewImageWidth={804}
          mobilePreviewImageHeight={880}
          mobilePreviewImageCropTopPercent={20}
          githubRepoUrl="https://github.com/thesysdev/openclaw-os"
          githubButtonLabel="Star us on GitHub"
          widePreview
          showTagline
          taglineCompact
          tagline={
            <>
              OpenClaw OS is a workspace for managing and operating your OpenClaw agent.{" "}
              <br className={heroStyles.taglineBreak} />
              Generate interactive apps and artifacts, instantly for any use case.
            </>
          }
        />
      </div>
      <div className={styles.contentSection}>
        <div className={`${styles.contentShell} ${styles.contentShellTight}`}>
          <PossibilitiesSection
            title="Generate an app for that..."
            tagline="With OpenClaw OS, any use case becomes a working app, instantly generated and always updated with live data."
            cards={[
              {
                titlePrefix: "An app to",
                title: "track company sales.",
                image: "/business-health.png",
              },
              {
                titlePrefix: "An app to",
                title: "monitor sprint progress.",
                image: "/engineering-board.png",
              },
              {
                titlePrefix: "An app to",
                title: "observe social media.",
                image: "/marketing-dashboard.png",
              },
              {
                titlePrefix: "An app to",
                title: "track stock market.",
                image: "/stocks-tracker.png",
              },
            ]}
          />
          <FeaturesSection features={OPENCLAW_FEATURES} showCta={false} />
          <StuckInChatSection
            installCommand={INSTALL_COMMAND}
            windowsInstallCommand={WINDOWS_INSTALL_COMMAND}
          />
        </div>
        <GradientDivider direction="up" />
      </div>
      <Footer />
    </div>
  );
}
