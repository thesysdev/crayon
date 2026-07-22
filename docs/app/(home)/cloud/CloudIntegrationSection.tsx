import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { CloudCodeBlock } from "./CloudCodeBlock";
import styles from "./CloudIntegrationSection.module.css";

const CLIENT_EXAMPLE = `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.THESYS_API_KEY,
  baseURL: "https://api.thesys.dev/v1/embed",
});`;

const CUSTOMERS = [
  {
    name: "Pointlabs",
    background: "/openui-cloud/pointlabs-bg.png",
    logo: "/openui-cloud/pointlabs-logo.png",
    logoWidth: 153,
    logoHeight: 40,
    description:
      "Pointlabs replaced A2UI with OpenUI Cloud to power a voice-first AI travel concierge",
  },
  {
    name: "Entelligence",
    background: "/openui-cloud/entelligence-bg.png",
    logo: "/openui-cloud/entelligence-logo.svg",
    logoWidth: 209,
    logoHeight: 40,
    description:
      "Using OpenUI Cloud to deliver engineering intelligence through AI-native Generative UI experiences.",
  },
  {
    name: "Wisdom AI",
    background: "/openui-cloud/wisdom-bg.png",
    logo: "/openui-cloud/wisdom-logo.svg",
    logoWidth: 168,
    logoHeight: 40,
    description:
      "Using OpenUI Cloud artifacts to create shareable reports with enterprise-ready business insights.",
  },
] as const;

export function CloudIntegrationSection() {
  return (
    <section className={styles.section} aria-labelledby="cloud-integration-title">
      <div className={styles.inner}>
        <div className={styles.content}>
          <h2 id="cloud-integration-title" className={styles.title}>
            Switch to OpenUI <span className={styles.cloudTag}>Cloud</span>
            <br />
            in seconds
          </h2>
          <ol className={styles.stepper} aria-label="Upgrade to OpenUI Cloud">
            <li className={styles.step}>
              <span className={styles.stepMarker}>1</span>
              <div className={styles.stepContent}>
                <a
                  className={styles.stepLink}
                  href="https://console.thesys.dev/keys"
                  target="_blank"
                  rel="noreferrer"
                >
                  Generate an API Key
                  <ArrowUpRight size={16} strokeWidth={2} aria-hidden="true" />
                </a>
                <p className={styles.stepDescription}>
                  Create a Cloud API key from the OpenUI console.
                </p>
              </div>
            </li>
            <li className={styles.step}>
              <span className={styles.stepMarker}>2</span>
              <div className={styles.stepContent}>
                <span className={styles.stepTitle}>Update your base URL</span>
                <p className={styles.stepDescription}>
                  Point your OpenAI-compatible client to the OpenUI Cloud endpoint.
                </p>
              </div>
            </li>
          </ol>
        </div>

        <div className={styles.codeColumn} aria-label="OpenUI Cloud client configuration">
          <CloudCodeBlock code={CLIENT_EXAMPLE} />
        </div>
      </div>

      <div className={styles.customers}>
        <h2 className={styles.customersTitle}>
          Real products &amp; workflows,{" "}
          <span className={styles.customersTitleSecondary}>
            built with OpenUI <span className={styles.cloudTag}>Cloud</span>
          </span>
        </h2>

        <div className={styles.customerGrid}>
          {CUSTOMERS.map((customer) => (
            <article key={customer.name} className={styles.customerCard}>
              <Image
                className={styles.customerBackground}
                src={customer.background}
                alt=""
                fill
                sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 400px"
              />
              <div className={styles.customerOverlay} aria-hidden="true" />
              <Image
                className={styles.customerLogo}
                src={customer.logo}
                alt={customer.name}
                width={customer.logoWidth}
                height={customer.logoHeight}
              />
              <p className={styles.customerDescription}>{customer.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
