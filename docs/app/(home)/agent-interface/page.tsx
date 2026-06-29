import {
  Boxes,
  FileText,
  LayoutDashboard,
  Puzzle,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import type { Metadata } from "next";
import type { ComponentType, SVGProps } from "react";
import { SectionHeader } from "../components/SectionHeader/SectionHeader";
import homeStyles from "../page.module.css";
import { AgentInterfaceBanner } from "../sections/AgentInterfaceBanner/AgentInterfaceBanner";
import { CompatibilitySection } from "../sections/CompatibilitySection/CompatibilitySection";
import { Footer } from "../sections/Footer/Footer";
import {
  DesktopGithubButton,
  GitHubBanner,
  HeroSection,
  NpmButton,
} from "../sections/HeroSection/HeroSection";
import heroStyles from "../sections/HeroSection/HeroSection.module.css";
import { AgentFeatures } from "./AgentFeatures";
import { AgentSteps } from "./AgentSteps";
import styles from "./page.module.css";

const FEATURE_CARDS: { title: string; image?: string }[] = [
  { title: "Threads", image: "/agent-interface/Threads.png" },
  { title: "Navigation", image: "/agent-interface/Navigation.png" },
  { title: "Composer", image: "/agent-interface/Composer.png" },
  { title: "Messages", image: "/agent-interface/Messages.png" },
  { title: "Thinking", image: "/agent-interface/Thinking.png" },
  { title: "Notifications", image: "/agent-interface/Notifications.png" },
];

type WideFeature = {
  title: string;
  description: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  image?: string;
};

const WIDE_FEATURES: WideFeature[] = [
  {
    title: "Build beyond text responses",
    description:
      "Render charts, tables, forms, cards, and workflows directly from your agent output.",
    Icon: LayoutDashboard,
    image: "/agent-interface/Buildbeyondtextresponses.png",
  },
  {
    title: "Turn conversations into Artifacts",
    description:
      "Create reports, slides, summaries, and artifacts users can edit, share, and act on.",
    Icon: FileText,
    image: "/agent-interface/turnconversationsintoartifacts.png",
  },
  {
    title: "Start simple, customize deeply",
    description:
      "Start with a complete default workspace, then customize every region as your agent experience grows.",
    Icon: SlidersHorizontal,
    image: "/agent-interface/startsimplecustomizedeeply.png",
  },
  {
    title: "Responsive by default",
    description: "Your AI workspace adjusts cleanly across devices, layouts, and screen sizes.",
    Icon: Boxes,
    image: "/agent-interface/responsivebydefault.png",
  },
];

const AGENT_INTERFACE_DESCRIPTION =
  "An open-source production-ready AI-native workspace where your users can ask, generate, create, and act.";

const INSTALL_COMMAND = "# install command coming soon";
const GITHUB_URL = "https://github.com/thesysdev/openui";
const DESKTOP_PREVIEW_IMAGE = "/agent-interface/agentinterfacehero.svg";
const DESKTOP_PREVIEW_WIDTH = 1516;
const DESKTOP_PREVIEW_HEIGHT = 961;
const MOBILE_PREVIEW_IMAGE = "/agent-interface/agentinterfacehero.svg";
const MOBILE_PREVIEW_WIDTH = 1516;
const MOBILE_PREVIEW_HEIGHT = 961;

export const metadata: Metadata = {
  title: "Agent Interface — AI-native interface for your SaaS",
  description: AGENT_INTERFACE_DESCRIPTION,
  alternates: { canonical: "/agent-interface" },
  openGraph: {
    title: "Agent Interface — AI-native interface for your SaaS",
    description: AGENT_INTERFACE_DESCRIPTION,
    url: "/agent-interface",
    type: "website",
  },
  twitter: {
    title: "Agent Interface — AI-native interface for your SaaS",
    description: AGENT_INTERFACE_DESCRIPTION,
    card: "summary_large_image",
  },
};

export default function AgentInterfacePage() {
  return (
    <main className={styles.page}>
      <div className={homeStyles.heroShell}>
        <HeroSection
          title="Agent interface"
          subtitle={
            <>
              An open-source, production-ready workspace{" "}
              <br className={heroStyles.taglineBreak} />
              for your AI-native product.
            </>
          }
          command={INSTALL_COMMAND}
          align="left"
          smallSubtitle
          showBanner={false}
          showPlaygroundButton={false}
          showGitHubBanner={false}
          desktopPreviewImage={DESKTOP_PREVIEW_IMAGE}
          desktopPreviewImageAlt="Agent Interface workspace"
          desktopPreviewImageWidth={DESKTOP_PREVIEW_WIDTH}
          desktopPreviewImageHeight={DESKTOP_PREVIEW_HEIGHT}
          mobilePreviewImage={MOBILE_PREVIEW_IMAGE}
          mobilePreviewImageWidth={MOBILE_PREVIEW_WIDTH}
          mobilePreviewImageHeight={MOBILE_PREVIEW_HEIGHT}
          showTagline
          tagline={
            <>
              SaaS 1.0 was built around static screens.{" "}
              <br className={heroStyles.taglineBreak} />
              SaaS 2.0 will be built around intent-based UI generation.{" "}
              <br className={heroStyles.taglineBreak} />
              Agent Interface is the surface built for this new age of software.
            </>
          }
        />
      </div>

      <div className={homeStyles.contentSection}>
        <div className={homeStyles.contentShell}>
          <AgentInterfaceBanner />
          <section className={styles.featureCards}>
            <div className={styles.featureCardsHeader}>
              <SectionHeader
                title="Complete interface, Batteries included."
                subtitle={
                  <>
                    All the interface primitives your AI product needs,
                    <br className={styles.responsiveBreak} />
                    packaged into one workspace your users love.
                  </>
                }
              />
            </div>
            <div className={styles.featureCardsGrid}>
              {FEATURE_CARDS.map(({ title, image }) => (
                <div className={styles.featureCard} key={title}>
                  <div className={styles.featureCardImage} aria-hidden="true">
                    {image && <img alt="" src={image} />}
                  </div>
                  <span className={styles.featureCardTitle}>{title}</span>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.wideFeatures}>
            {WIDE_FEATURES.map(({ title, description, image }) => (
              <article className={styles.wideFeature} key={title}>
                <div className={styles.wideFeatureMedia} aria-hidden="true">
                  {image && <img alt="" src={image} />}
                </div>
                <h3 className={styles.wideFeatureTitle}>{title}</h3>
                <p className={styles.wideFeatureDescription}>{description}</p>
              </article>
            ))}
          </section>

          <div className={styles.compatibilityWrap}>
            <CompatibilitySection
              title={
                <>
                  Works with your stack.
                  <br />
                  Any LLM, UI library, and framework.
                </>
              }
            />
          </div>

          <div className={styles.agentFeaturesWrap}>
            <AgentFeatures />
          </div>

          <section className={styles.agentSteps}>
            <div className={styles.agentStepsHeader}>
              <SectionHeader
                title="Use cases across modern SaaS"
                subtitle="Bring agent-led workflows without rebuilding your product experience."
              />
            </div>
            <AgentSteps />
          </section>

          <section className={styles.ctaSection}>
            <div className={styles.ctaHeader}>
              <SectionHeader title="Make your product AI-native today" />
            </div>
            <div className={styles.ctaCardsWrap}>
              <article className={styles.ctaCard}>
                <span className={styles.ctaCardIcon} aria-hidden="true">
                  <Sparkles size={16} strokeWidth={1.8} />
                </span>
                <h3 className={styles.ctaCardTitle}>Launch as a standalone</h3>
                <p className={styles.ctaCardDescription}>
                  A complete workspace with every primitive your users expect.
                </p>
              </article>
              <div className={styles.ctaOrDivider} aria-hidden="true">
                <span className={styles.ctaOr}>Or</span>
              </div>
              <article className={styles.ctaCard}>
                <span className={styles.ctaCardIcon} aria-hidden="true">
                  <Puzzle size={16} strokeWidth={1.8} />
                </span>
                <h3 className={styles.ctaCardTitle}>Embed in your existing product</h3>
                <p className={styles.ctaCardDescription}>
                  Drop into your product with your design system, auth, and data.
                </p>
              </article>
            </div>
            <div className={styles.ctaActions}>
              <NpmButton className={heroStyles.mobileCtaButtonWidth} command={INSTALL_COMMAND} />
              <GitHubBanner
                href={GITHUB_URL}
                label="Star us on Github"
                className={`${styles.heroGithubMobile} ${heroStyles.mobileCtaButtonWidth}`}
              />
              <DesktopGithubButton
                href={GITHUB_URL}
                label="Star us on Github"
                className={styles.heroGithubDesktop}
              />
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
