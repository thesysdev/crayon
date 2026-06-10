import { JsonLd } from "@/components/seo/JsonLd";
import { BASE_URL } from "@/lib/source";
import styles from "./page.module.css";
import { CompatibilitySection } from "./sections/CompatibilitySection/CompatibilitySection";
import { FeaturesSection } from "./sections/FeaturesSection/FeaturesSection";
import { Footer } from "./sections/Footer/Footer";
import { GradientDivider } from "./sections/GradientDivider/GradientDivider";
import { HeroSection } from "./sections/HeroSection/HeroSection";
import { PossibilitiesSection } from "./sections/PossibilitiesSection/PossibilitiesSection";
import { ShiroMascot } from "./sections/ShiroMascot/ShiroMascot";
import { StepsSection } from "./sections/StepsSection/StepsSection";
import { TweetWallSection } from "./sections/TweetWallSection/TweetWallSection";

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "OpenUI",
    url: BASE_URL,
    logo: `${BASE_URL}/favicon.svg`,
    sameAs: ["https://github.com/thesysdev/openui", "https://discord.com/invite/Pbv5PsqUSv"],
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "OpenUI",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    url: BASE_URL,
    description:
      "OpenUI is a full-stack Generative UI framework with a compact streaming-first language, a React runtime with built-in components, and ready-to-use chat interfaces.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  },
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      <JsonLd data={jsonLd} />
      <div className={styles.heroShell}>
        <HeroSection
          showPlaygroundButton={false}
          githubRepoUrl="https://github.com/thesysdev/openui"
          githubButtonLabel="Star us on GitHub"
        />
        <ShiroMascot />
        <StepsSection />
      </div>
      <div className={styles.contentSection}>
        <GradientDivider direction="down" />
        <div className={styles.contentShell}>
          <PossibilitiesSection />
          <CompatibilitySection />
          <FeaturesSection />
          <TweetWallSection />
        </div>
        <GradientDivider direction="up" />
      </div>
      <Footer />
    </div>
  );
}
