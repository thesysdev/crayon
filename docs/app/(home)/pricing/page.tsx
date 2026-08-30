import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { BevelButton } from "../components/Button/BevelButton";
import pageStyles from "../page.module.css";
import { Footer } from "../sections/Footer/Footer";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "OpenUI Pricing",
  description:
    "OpenUI is MIT licensed and free forever. Add OpenUI Gateway for production reliability and OpenUI Observability for agent product analytics.",
  alternates: { canonical: "/pricing" },
};

const PLANS = [
  {
    name: "Free",
    price: "$0",
    cadence: "/mo",
    description: "For individuals exploring OpenUI Cloud with core limits.",
    features: [
      "3K API calls per month",
      "Bring your own LLM key",
      "Style customizations and popular LLM support",
      "Discord community support",
    ],
    cta: "Get started for free",
    href: "https://console.thesys.dev/keys",
  },
  {
    name: "Build",
    price: "$49",
    cadence: "/mo",
    description: "For small teams shipping their first AI features.",
    features: [
      "Everything in Free",
      "25K API calls per month",
      "$0.002 per call after",
      "Higher request priority and rate limits",
      "Email support",
    ],
    cta: "Generate API key",
    href: "https://console.thesys.dev/keys",
  },
  {
    name: "Grow",
    price: "$499",
    cadence: "/mo",
    description: "For businesses scaling production AI workloads.",
    features: [
      "Everything in Build",
      "500K API calls per month",
      "$0.001 per call after",
      "Highest request priority and rate limits",
      "Priority support and solutions engineering",
      "SSO/SAML",
    ],
    cta: "Generate API key",
    href: "https://console.thesys.dev/keys",
  },
  {
    name: "Scale",
    price: "Custom",
    cadence: "",
    description: "For enterprises needing control over infrastructure, data, and models.",
    features: [
      "Everything in Grow",
      "Self-hosting or VPC deployment",
      "Custom rate limits and usage controls",
      "Compliance, SLAs, and support guarantees",
    ],
    cta: "Contact sales",
    href: "https://zcal.co/t/thesys/demo",
  },
];

const BILLING_DETAILS = [
  {
    title: "No markup on LLMs",
    description:
      "Tokens are billed separately from API calls at provider list prices. Bring your own OpenAI, Anthropic, or Google keys if you prefer.",
  },
  {
    title: "Repair is included",
    description:
      "Validation and correction calls are part of your Gateway plan and are not billed separately.",
  },
  {
    title: "Zero data retention available",
    description: "Zero data retention is available on paid models when you need it.",
  },
];

export default function PricingPage() {
  return (
    <div className={pageStyles.page}>
      <main className={styles.main}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Pricing</p>
          <h1 className={styles.title}>Three ways to use OpenUI.</h1>
          <p className={styles.subtitle}>
            Start with the open-source framework. Add Gateway for production reliability and
            Observability to understand what users experienced.
          </p>
        </header>

        <section className={`${styles.productSection} ${styles.productHighlight}`}>
          <div className={styles.productHeader}>
            <div className={styles.productCopy}>
              <p className={styles.productEyebrow}>
                OpenUI <span className={styles.productTag}>Open source</span>
              </p>
              <h2 className={styles.productTitle}>Free forever.</h2>
              <p className={styles.productDescription}>
                Build agent-driven interfaces with any model, backend framework, client, or design
                system. Run it wherever you want with no usage limits from us.
              </p>
            </div>
          </div>
          <div className={styles.productFooter}>
            <ul className={styles.productPoints}>
              <li>Open source forever</li>
              <li>Self-host anywhere</li>
              <li>Bring your whole stack</li>
            </ul>
            <BevelButton
              href="/docs/openui-lang"
              variant="secondary"
              label="Get started"
              badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
            />
          </div>
        </section>

        <section className={styles.productSection} aria-labelledby="gateway-plans">
          <div className={styles.productHeader}>
            <div className={styles.productCopy}>
              <p className={styles.productEyebrow}>
                OpenUI Gateway <span className={styles.productTag}>Cloud</span>
              </p>
              <h2 id="gateway-plans" className={styles.productTitle}>
                Reliability for production Generative UI.
              </h2>
              <p className={styles.productDescription}>
                Validate and repair model output before it reaches users, with provider fallbacks,
                usage dashboards, and one OpenAI-compatible endpoint.
              </p>
            </div>
            <div className={styles.priceLockup}>
              <span className={styles.productPrice}>From $0</span>
              <span className={styles.priceNote}>per month</span>
            </div>
          </div>

          <div className={styles.planGrid}>
            {PLANS.map((plan) => (
              <article className={styles.plan} key={plan.name}>
                <div>
                  <h3 className={styles.planName}>{plan.name}</h3>
                  <p className={styles.price}>
                    {plan.price}
                    {plan.cadence ? <span className={styles.cadence}>{plan.cadence}</span> : null}
                  </p>
                  <p className={styles.planDescription}>{plan.description}</p>
                </div>
                <ul className={styles.features}>
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <BevelButton
                  className={styles.planCta}
                  href={plan.href}
                  external
                  variant="primary"
                  label={plan.cta}
                  badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
                />
              </article>
            ))}
          </div>

          <div className={styles.billingDetails}>
            {BILLING_DETAILS.map((detail) => (
              <article className={styles.billingDetail} key={detail.title}>
                <h3>{detail.title}</h3>
                <p>{detail.description}</p>
              </article>
            ))}
          </div>

          <p className={styles.freeModelNote}>
            API calls are included in each plan. LLM tokens are billed separately at provider
            rates. Annual billing saves up to 20%. Free models have zero LLM cost and may use data
            for training.
          </p>
        </section>

        <section className={`${styles.productSection} ${styles.productHighlight}`}>
          <div className={styles.productHeader}>
            <div className={styles.productCopy}>
              <p className={styles.productEyebrow}>
                OpenUI Observability <span className={styles.productTag}>Early access</span>
              </p>
              <h2 className={styles.productTitle}>Free while in early access.</h2>
              <p className={styles.productDescription}>
                See what users saw, find the sessions worth opening, and turn problematic responses
                into feedback and evals.
              </p>
            </div>
          </div>
          <div className={styles.productFooter}>
            <ul className={styles.productPoints}>
              <li>Session replay</li>
              <li>AI-assisted triage</li>
              <li>Feedback into evals</li>
            </ul>
            <BevelButton
              href="/cloud/observability"
              variant="secondary"
              label="Join the waitlist"
              badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
