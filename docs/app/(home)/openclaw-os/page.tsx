import { createPageMetadata } from "@/lib/page-metadata";
import styles from "../page.module.css";
import { Footer } from "../sections/Footer/Footer";
import { HeroSection } from "../sections/HeroSection/HeroSection";
import heroStyles from "../sections/HeroSection/HeroSection.module.css";
import { PossibilitiesSection } from "../sections/PossibilitiesSection/PossibilitiesSection";
import { StuckInChatSection } from "../sections/StuckInChatSection/StuckInChatSection";
import { InstallSplitButton } from "./InstallSplitButton";
import page from "./metadata";
import { OpenClawFeatures } from "./OpenClawFeatures";

const INSTALL_COMMAND = "curl -fsSL https://openui.com/openclaw-os/install.sh | bash";
const WINDOWS_INSTALL_COMMAND =
  'powershell -c "irm https://openui.com/openclaw-os/install.ps1 | iex"';

export const metadata = createPageMetadata(page);

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
                <img src="/openclaw-dark.svg" alt="OpenClaw logo" />
              </span>
              OpenClaw.
            </>
          }
          command={INSTALL_COMMAND}
          commandSlot={
            <InstallSplitButton macCommand={INSTALL_COMMAND} winCommand={WINDOWS_INSTALL_COMMAND} />
          }
          align="left"
          desktopPreviewImage="/openclaw-os/hero-light.webp"
          desktopPreviewImageDark="/openclaw-os/hero-dark.webp"
          desktopPreviewImageAlt="OpenClaw OS workspace"
          desktopPreviewImageWidth={1568}
          desktopPreviewImageHeight={940}
          mobilePreviewImage="/openclaw-os/hero-light.webp"
          mobilePreviewImageDark="/openclaw-os/hero-dark.webp"
          mobilePreviewImageAlt="OpenClaw OS workspace"
          mobilePreviewImageWidth={1568}
          mobilePreviewImageHeight={940}
          smallSubtitle
          showPlaygroundButton={false}
          showGitHubBanner={false}
          showTagline={false}
        />
      </div>
      <div className={styles.contentSection}>
        <div className={styles.contentShell}>
          <OpenClawFeatures />
          <PossibilitiesSection
            title="Generate an app for that..."
            tagline="With OpenClaw OS, any use case becomes a working app, instantly generated and always updated with live data."
            cards={[
              {
                titlePrefix: "An app to",
                title: "track company sales.",
                lightImage: "/business-health-light.png",
                darkImage: "/business-health-dark.png",
              },
              {
                titlePrefix: "An app to",
                title: "monitor sprint progress.",
                lightImage: "/engineering-board-light.png",
                darkImage: "/engineering-board-dark.png",
              },
              {
                titlePrefix: "An app to",
                title: "observe social media.",
                lightImage: "/marketing-dashboard-light.png",
                darkImage: "/marketing-dashboard-dark.png",
              },
              {
                titlePrefix: "An app to",
                title: "track stock market.",
                lightImage: "/stocks-tracker-light.png",
                darkImage: "/stocks-tracker-dark.png",
              },
            ]}
          />
          <StuckInChatSection
            installCommand={INSTALL_COMMAND}
            windowsInstallCommand={WINDOWS_INSTALL_COMMAND}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
}
