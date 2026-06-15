import {
  Boxes,
  FileText,
  LayoutDashboard,
  Puzzle,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import type { Metadata } from "next";
import homeStyles from "../page.module.css";
import { Footer } from "../sections/Footer/Footer";
import { GradientDivider } from "../sections/GradientDivider/GradientDivider";
import { CompatibilitySection } from "../sections/CompatibilitySection/CompatibilitySection";
import {
  DesktopGithubButton,
  GitHubBanner,
  NpmButton,
  Tagline,
} from "../sections/HeroSection/HeroSection";
import heroStyles from "../sections/HeroSection/HeroSection.module.css";
import { ShiroMascot } from "../sections/ShiroMascot/ShiroMascot";
import { AgentFeatures } from "./AgentFeatures";
import { AgentSteps } from "./AgentSteps";
import { HeroPreview } from "./HeroPreview";

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
    description:
      "Your AI workspace adjusts cleanly across devices, layouts, and screen sizes.",
    Icon: Boxes,
    image: "/agent-interface/responsivebydefault.png",
  },
];
import styles from "./page.module.css";

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
      <section className={styles.heroSection}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <h1 className={styles.title}>AI-native interface for your SaaS.</h1>
            <p className={styles.subtitle}>
              An open-source production-ready AI-native workspace
              <br className={styles.responsiveBreak} />
              where your users can ask, generate, create, and act.
            </p>
            <div className={styles.heroActions}>
              <NpmButton
                className={heroStyles.mobileCtaButtonWidth}
                command={INSTALL_COMMAND}
              />
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
          </div>
        </div>

        <HeroPreview
          desktopImage={DESKTOP_PREVIEW_IMAGE}
          desktopWidth={DESKTOP_PREVIEW_WIDTH}
          desktopHeight={DESKTOP_PREVIEW_HEIGHT}
          mobileImage={MOBILE_PREVIEW_IMAGE}
          mobileWidth={MOBILE_PREVIEW_WIDTH}
          mobileHeight={MOBILE_PREVIEW_HEIGHT}
        />

        <Tagline compact>
          SaaS 1.0 was built around static screens.{" "}
          <br className={heroStyles.taglineBreak} />
          SaaS 2.0 will be built around intent-based UI generation.{" "}
          <br className={heroStyles.taglineBreak} />
          Agent Interface is the surface built for this new age of software.
        </Tagline>
      </section>

      <ShiroMascot />

      <div className={homeStyles.contentSection}>
        <div className={homeStyles.contentShell}>
          <section className={styles.featureCards}>
            <div className={styles.featureCardsHeader}>
              <h2 className={styles.featureCardsTitle}>Complete interface, Batteries included.</h2>
              <p className={styles.featureCardsDescription}>
                All the interface primitives your AI product needs,
                <br className={styles.responsiveBreak} />
                packaged into one workspace your users love.
              </p>
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
              <h2 className={styles.agentStepsTitle}>Use cases across modern SaaS</h2>
              <p className={styles.agentStepsDescription}>
                Bring agent-led workflows without rebuilding your product experience.
              </p>
            </div>
            <AgentSteps />
          </section>

          <section className={styles.ctaSection}>
            <h2 className={styles.ctaTitle}>Make your product AI-native today</h2>
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
              <NpmButton
                className={heroStyles.mobileCtaButtonWidth}
                command={INSTALL_COMMAND}
              />
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
        <GradientDivider direction="up" compact />
      </div>

      <Footer />
    </main>
  );
}
