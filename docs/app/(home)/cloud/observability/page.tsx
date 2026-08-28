import type { Metadata } from "next";
import Image from "next/image";
import styles from "../../page.module.css";
import { Footer } from "../../sections/Footer/Footer";
import { HeroSection, Tagline } from "../../sections/HeroSection/HeroSection";
import { ListSection } from "../ListSection";
import { CloudCtaSection } from "./CloudCtaSection";
import { EarlyAccessForm } from "./EarlyAccessForm";
import { FaqSection } from "./FaqSection";
import { FeaturesSection } from "./FeaturesSection";
import { IntegrateSection } from "./IntegrateSection";
import cloudStyles from "./page.module.css";
import { WhySection } from "./WhySection";

/* Three rows, not seven. An earlier version walked through capture modes, the
   beforeSend hook and sampling one at a time, which is a docs page wearing a
   marketing page's clothes. What a reader needs here is that it is secure,
   compliant, and that they decide what is sent; the API that makes the third
   one true belongs in the SDK reference. */
const TRUST_ITEMS = [
  {
    term: "You control what is sent",
    description:
      "One option limits the SDK to metadata, so the generated response never leaves the browser. A hook can rewrite or drop any event before it does.",
  },
  {
    term: "Secure by default",
    description:
      "Your data is not used to train models. Private deployments, including self-hosting and VPC, are available on Scale.",
  },
  {
    term: "Compliant",
    description: (
      <>
        GDPR, SOC 2, and ISO 27001. Details at{" "}
        <a href="https://trust.thesys.dev" target="_blank" rel="noreferrer">
          trust.thesys.dev
        </a>
        .
      </>
    ),
  },
];

export const metadata: Metadata = {
  title: "OpenUI Observability - User insights for AI agents",
  description: "Understand what users need, where your agent falls short, and what to build next.",
  alternates: { canonical: "/cloud/observability" },
};

/* A structural copy of the OpenUI Cloud page with its copy and artwork removed.
   Every section component beside this file is a local copy too, so editing one
   here cannot affect /cloud.

   Fill it in a section at a time: each section's copy lives in its own file, and
   the order below is the page order. Sections you decide against can be deleted
   from this list and their file removed.

   LogoStrip is dropped for now; add it back beside the hero if this page wants
   one. */
export default function ObservabilityPage() {
  return (
    <div className={styles.page}>
      <div className={styles.heroShell}>
        <HeroSection
          align="left"
          title={
            <span className={cloudStyles.titleBlock}>
              {/* The same lockup Cloud uses, with the product name in the tag. */}
              <span className={cloudStyles.eyebrow}>
                OpenUI <span className={cloudStyles.cloudTag}>Observability</span>
              </span>
              {/* The break is real markup but only takes effect on the desktop
                  lockup; the mobile one shares this node and wraps on its own. */}
              <span className={cloudStyles.title}>
                User insights <br className={cloudStyles.titleBreak} />
                for AI agents
              </span>
            </span>
          }
          subtitle={
            <span className={cloudStyles.subtitle}>
              Understand what users need, where your agent falls short, and what to build next.
            </span>
          }
          smallSubtitle
          tightDesktopSpacing={false}
          splitLockup
          flushInnerInlinePadding
          commandSlot={<EarlyAccessForm />}
          showPlaygroundButton={false}
          showGitHubBanner={false}
          showTagline={false}
          desktopPreviewSlot={
            <>
              <Image
                className={`${cloudStyles.heroImage} ${cloudStyles.heroImageLight}`}
                src="/openui-observability/hero-light.webp"
                alt="OpenUI Observability insights preview"
                width={1280}
                height={600}
                priority
              />
              <Image
                className={`${cloudStyles.heroImage} ${cloudStyles.heroImageDark}`}
                src="/openui-observability/hero-dark.webp"
                alt=""
                aria-hidden="true"
                width={1280}
                height={600}
                priority
              />
            </>
          }
          mobilePreviewSlot={
            <>
              <Image
                className={`${cloudStyles.heroImage} ${cloudStyles.heroImageLight}`}
                src="/openui-observability/hero-mobile-light.webp"
                alt="OpenUI Observability insights preview"
                width={924}
                height={1040}
                priority
              />
              <Image
                className={`${cloudStyles.heroImage} ${cloudStyles.heroImageDark}`}
                src="/openui-observability/hero-mobile-dark.webp"
                alt=""
                aria-hidden="true"
                width={924}
                height={1040}
                priority
              />
            </>
          }
        />

        {/* The large centred statement, with its caption underneath. No audience
            named: PM, developer and domain expert overlap in practice, and
            picking one narrows the page for no gain. The traces contrast is left
            as a caption because the section below argues it properly. */}
        <Tagline>
          <span className={cloudStyles.taglineText}>Product analytics for AI agents,</span>
          <span className={cloudStyles.taglineNote}>not just traces</span>
        </Tagline>

        {/* Problem, then the features that answer it, then what it costs to adopt
            and what it costs you in data — the Gateway page's spine. */}
        <WhySection />
        <FeaturesSection />
        <IntegrateSection />

        <ListSection
          id="observability-trust"
          title="Secure, compliant, and under your control"
          items={TRUST_ITEMS}
        />

        <FaqSection />
        <CloudCtaSection />
      </div>
      <Footer />
    </div>
  );
}
