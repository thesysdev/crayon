import type { Metadata } from "next";
import styles from "./page.module.css";
import { CloudBanner } from "./sections/CloudBanner/CloudBanner";
import { CloudSection } from "./sections/CloudSection/CloudSection";
import { FeatureGridSection } from "./sections/FeatureGridSection/FeatureGridSection";
import { Footer } from "./sections/Footer/Footer";
import { HeroSection, Tagline } from "./sections/HeroSection/HeroSection";
import { LogoStrip } from "./sections/LogoStrip/LogoStrip";
import { ShiroPeek } from "./sections/ShiroPeek/ShiroPeek";
import { StackDiagramSection } from "./sections/StackDiagramSection/StackDiagramSection";
import { TweetWallSection } from "./sections/TweetWallSection/TweetWallSection";
import { UseCasesSection } from "./sections/UseCasesSection/UseCasesSection";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

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
      </div>
      {/* The diagram opens the content band, so the page gradient starts here
          rather than at the use cases below it. */}
      <div className={styles.contentSection}>
        <StackDiagramSection />
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
