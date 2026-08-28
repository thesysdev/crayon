import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { BevelButton } from "../../components/Button/BevelButton";
import styles from "../../page.module.css";
import { Footer } from "../../sections/Footer/Footer";
import { HeroSection } from "../../sections/HeroSection/HeroSection";
import { CloudCtaSection } from "../CloudCtaSection";
import { FaqSection } from "./FaqSection";
import { IntegrateSection } from "./IntegrateSection";
import { ListSection } from "../ListSection";
import gatewayStyles from "./page.module.css";
import { PricingSection } from "./PricingSection";
import { RepairSection } from "./RepairSection";
import { WhySection } from "./WhySection";

export const metadata: Metadata = {
  title: "OpenUI Gateway - Reliable Generative UI in production",
  description:
    "An OpenAI-compatible API that validates every model response against your component library and corrects it in the streaming path.",
  alternates: { canonical: "/cloud/gateway" },
  openGraph: {
    title: "OpenUI Gateway — Reliable Generative UI in production",
    description:
      "Validation, automatic correction, model routing, and provider fallbacks through an OpenAI-compatible API.",
    url: "/cloud/gateway",
    type: "website",
  },
};

/* Section order is the argument: the problem first and measured (WhySection),
   then the mechanism (RepairSection), then what it costs to adopt, then the
   trust material. Nothing above IntegrateSection mentions price, and nothing
   below it re-argues the problem. */
const DASHBOARD_ITEMS = [
  {
    term: "Corrections",
    description: "Error and correction rates by model, so you can see what is being repaired.",
  },
  {
    term: "Usage and cost",
    description: "Spend and call volume by API key, without adding a separate tool.",
  },
];

const COMPATIBILITY_ITEMS = [
  {
    term: "No markup",
    description: "Provider list prices for tokens, the same rates you would pay going direct.",
  },
  {
    term: "OpenAI-compatible",
    description: "Chat Completions and Responses endpoints, so your existing SDK calls work as-is.",
  },
  {
    term: "Your own keys",
    description:
      "Bring your own OpenAI, Anthropic, and Google Vertex keys. Existing commitments carry over.",
  },
  {
    term: "Other gateways",
    description:
      "Runs behind Portkey or any other OpenAI-compatible gateway, since the endpoints are OpenAI-compliant.",
  },
  {
    term: "Caching",
    description: "Upstream cache configurations are honored.",
  },
  {
    term: "Models",
    description: "Any model string on models.dev, with more models available through OpenRouter.",
  },
];

const SECURITY_ITEMS = [
  {
    term: "Data retention",
    /* Named by endpoint rather than claimed across the board: ZDR is not
       uniform, so the page says exactly where it holds. A blanket claim is the
       kind of thing a security review catches. */
    description: "Chat Completions is zero data retention by default on paid models.",
  },
  {
    term: "Training",
    description: "Your data is not used to train models, with the exception of free models.",
  },
  {
    term: "Compliance",
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
  {
    term: "Fallbacks",
    description:
      "If a provider becomes unavailable, the same model is served from an alternate provider.",
  },
  {
    term: "Uptime",
    description: (
      <>
        Live and historical status at{" "}
        <a href="https://status.thesys.dev" target="_blank" rel="noreferrer">
          status.thesys.dev
        </a>
        .
      </>
    ),
  },
  {
    term: "Deployment",
    description: "Private deployments, including self-hosting and VPC, are available on Scale.",
  },
];

export default function GatewayPage() {
  return (
    <div className={styles.page}>
      <div className={styles.heroShell}>
        <HeroSection
          align="left"
          title={
            <span className={gatewayStyles.titleBlock}>
              {/* The lockup Cloud and Observability share, with the product name
                  in the tag. */}
              <span className={gatewayStyles.eyebrow}>
                OpenUI <span className={gatewayStyles.cloudTag}>Gateway</span>
              </span>
              <span className={gatewayStyles.title}>Ship OpenUI in production</span>
            </span>
          }
          subtitle={
            <span className={gatewayStyles.subtitle}>
              An OpenAI-compatible API that validates every model response against your component
              library and corrects it in the streaming path.
            </span>
          }
          smallSubtitle
          tightDesktopSpacing={false}
          splitLockup
          flushInnerInlinePadding
          commandSlot={
            <div className={gatewayStyles.ctaGroup}>
              <BevelButton
                href="https://console.thesys.dev/keys"
                external
                variant="primary"
                label="Get API Key"
                badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
              />
              <BevelButton
                href="https://zcal.co/t/thesys/demo"
                external
                variant="secondary"
                label="Get a demo"
                badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
              />
            </div>
          }
          showPlaygroundButton={false}
          showGitHubBanner={false}
          showTagline={false}
          /* Empty placeholders rather than artwork. HeroSection falls back to the
             home page's own preview whenever a slot is missing, which would put
             the "Without / With OpenUI" hotel comparison on this page.

             These are empty spans, not fragments: this is a server component and
             HeroSection is a client one, and an childless fragment serializes to
             null across that boundary — which reads as "no slot" and brings the
             fallback straight back. Both wrappers are unstyled when empty, so
             nothing is left behind. */
          desktopPreviewSlot={<span aria-hidden="true" />}
          mobilePreviewSlot={<span aria-hidden="true" />}
        />

        <WhySection />
        <RepairSection />
        <IntegrateSection />

        <ListSection
          id="gateway-dashboards"
          title="Usage, cost, and corrections in a single view"
          items={DASHBOARD_ITEMS}
          closer={
            <>
              Gateway reports on generation and delivery. Understanding whether the experience
              actually worked for the user is what{" "}
              <a href="/cloud/observability">OpenUI Observability</a> is for.
            </>
          }
        />

        <ListSection
          id="gateway-compatibility"
          title="Works with your existing stack"
          items={COMPATIBILITY_ITEMS}
          tight
        />

        <ListSection
          id="gateway-security"
          title="Security and compliance"
          items={SECURITY_ITEMS}
          tight
        />

        <PricingSection />
        <FaqSection />

        <CloudCtaSection
          title="Run OpenUI in production."
          primary={{ label: "Get API Key", href: "https://console.thesys.dev/keys", external: true }}
          secondary={{ label: "Get a demo", href: "https://zcal.co/t/thesys/demo", external: true }}
        />
      </div>
      <Footer />
    </div>
  );
}
