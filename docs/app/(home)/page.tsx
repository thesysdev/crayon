import styles from "./page.module.css";
import { CloudBanner } from "./sections/CloudBanner/CloudBanner";
import { CloudSection } from "./sections/CloudSection/CloudSection";
import { FeatureGridSection } from "./sections/FeatureGridSection/FeatureGridSection";
import { Footer } from "./sections/Footer/Footer";
import { HeroSection, Tagline } from "./sections/HeroSection/HeroSection";
import { LogoStrip } from "./sections/LogoStrip/LogoStrip";
import { ShiroPeek } from "./sections/ShiroPeek/ShiroPeek";
import { StepsSection } from "./sections/StepsSection/StepsSection";
import { TweetWallSection } from "./sections/TweetWallSection/TweetWallSection";
import { UseCasesSection } from "./sections/UseCasesSection/UseCasesSection";

export default function HomePage() {
  return (
    <div className={styles.page}>
      <div className={styles.heroShell}>
        <HeroSection
          align="left"
          subtitle="Open Standard for Generative UI"
          showPlaygroundButton={false}
          githubRepoUrl="https://github.com/thesysdev/openui"
          githubButtonLabel="Star us on GitHub"
          showTagline={false}
        />
        <LogoStrip />
        <Tagline />
        <StepsSection />
      </div>
      <div className={styles.contentSection}>
        <div className={styles.contentShell}>
          <UseCasesSection />
          <FeatureGridSection />
          <div className={styles.cloudGroup}>
            <ShiroPeek />
            <CloudSection />
          </div>
          <TweetWallSection />
        </div>
      </div>
      <Footer />
      <CloudBanner />
    </div>
  );
}
