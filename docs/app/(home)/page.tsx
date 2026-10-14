import { SITE_OPEN_GRAPH } from "@/lib/page-metadata";
import { BASE_URL } from "@/lib/source";
import type { Metadata } from "next";
import { AGENT_SETUP_PROMPT, AgentPicker } from "./components/AgentPicker/AgentPicker";
import styles from "./page.module.css";
import { BANNER_END_ANCHOR_ID } from "./sections/CloudBanner/CloudBanner";
import { CloudSection } from "./sections/CloudSection/CloudSection";
import { FAQS, FaqSection } from "./sections/FaqSection/FaqSection";
import { Footer } from "./sections/Footer/Footer";
import { HeroSection } from "./sections/HeroSection/HeroSection";
import { LogoStrip } from "./sections/LogoStrip/LogoStrip";
import { HeroProof } from "./sections/HeroProof/HeroProof";
import { CompatibilitySection } from "./sections/CompatibilitySection/CompatibilitySection";
import { HowItWorksSection } from "./sections/HowItWorksSection/HowItWorksSection";
import { WhatItDoesSection } from "./sections/WhatItDoesSection/WhatItDoesSection";
import { ShiroPeek } from "./sections/ShiroPeek/ShiroPeek";
import { TweetWallSection } from "./sections/TweetWallSection/TweetWallSection";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  openGraph: { ...SITE_OPEN_GRAPH, url: "/" },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.thesys.dev/#organization",
      name: "Thesys",
      url: "https://www.thesys.dev",
      logo: {
        "@type": "ImageObject",
        url: "https://www.thesys.dev/thesys-logo-bw.png",
        width: 360,
        height: 360,
      },
      sameAs: [
        "https://github.com/thesysdev",
        "https://x.com/thesysdev",
        "https://www.linkedin.com/company/thesysdev/",
      ],
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${BASE_URL}/#software`,
      name: "OpenUI",
      alternateName: "OpenUI by Thesys",
      url: BASE_URL,
      description:
        "Full-stack, framework-agnostic Generative UI built on OpenUI Lang, a streaming-first language with first-party runtimes for React, Vue, Svelte, and Angular.",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Cross-platform",
      license: "https://opensource.org/licenses/MIT",
      creator: { "@id": "https://www.thesys.dev/#organization" },
      publisher: { "@id": "https://www.thesys.dev/#organization" },
      softwareHelp: { "@type": "CreativeWork", url: `${BASE_URL}/docs` },
      sameAs: [
        "https://github.com/thesysdev/openui",
        "https://www.npmjs.com/org/openuidev",
        "https://x.com/thesysdev",
        "https://www.linkedin.com/company/thesysdev/",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      name: "OpenUI",
      alternateName: "OpenUI by Thesys",
      url: BASE_URL,
      publisher: { "@id": "https://www.thesys.dev/#organization" },
    },
    {
      "@type": "FAQPage",
      "@id": `${BASE_URL}/#faq`,
      mainEntity: FAQS.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer.join(" ") },
      })),
    },
  ],
};

export default function HomePage() {
  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c"),
        }}
      />
      {/* Five folds, in order: the hero, what OpenUI does, how it works, what
          it works with, then questions. Gateway and the tweet wall sit between
          the last two so they never interrupt that story. */}
      <div className={styles.heroShell}>
        <HeroSection
          align="left"
          desktopFromTablet
          subtitle={
            <>
              Open Standard for Generative UI
              <span className={styles.heroOutcome}>
                Make your AI apps and agents respond with intelligent UI, not just text.
              </span>
            </>
          }
          showPlaygroundButton={false}
          showTagline={false}
          commandTrailing={<AgentPicker command={AGENT_SETUP_PROMPT} />}
          /* No GitHub CTA in the hero on either breakpoint: the header carries
             the star count already. Dropping githubRepoUrl takes the desktop
             button; the mobile banner defaults on, so it is turned off here. */
          showGitHubBanner={false}
          /* Just the hero: what OpenUI is and how to start. The demo fold
             follows straight after, starting within the first screen. */
          showPreview={false}
        />
      </div>
      {/* The demo fold sits tight under the hero, so it starts halfway down
          the first screen. */}
      <div className={`${styles.contentSection} ${styles.contentSectionTight}`}>
        <div className={styles.contentShell}>
          {/* Fold 2: what it does. */}
          <WhatItDoesSection />

          {/* Fold 3: how it works. */}
          <HowItWorksSection />

          {/* Fold 4: integrations. */}
          <CompatibilitySection />

          {/* The proof, then the hosted product: fewer tokens and faster
              generation, then reliability in production. */}
          <HeroProof />

          {/* Then who uses OpenUI and what they say. */}
          <div className={styles.cloudGroup}>
            <ShiroPeek />
            <CloudSection />
          </div>
          <LogoStrip />
          <TweetWallSection />

          {/* Fold 5: FAQ. */}
          <div className={styles.faqBand} id={BANNER_END_ANCHOR_ID}>
            <FaqSection />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
