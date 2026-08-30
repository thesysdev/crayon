"use client";

import { useState } from "react";
import styles from "./sections.module.css";

// Monthly-equivalent plan rates from https://www.thesys.dev/pricing.
// The existing $49/$499 prices are annual-billing rates, not monthly-billing rates.
const PLANS = [
  {
    name: "Free",
    monthly: 0,
    annualMonthly: 0,
    calls: "3K",
    overage: "—",
    note: "Bring your own LLM key",
  },
  {
    name: "Build",
    monthly: 59,
    annualMonthly: 49,
    calls: "25K",
    overage: "$0.002/call",
    note: "Email support",
  },
  {
    name: "Grow",
    monthly: 599,
    annualMonthly: 499,
    calls: "500K",
    overage: "$0.001/call",
    note: "SSO/SAML, priority support",
  },
  {
    name: "Scale",
    monthly: null,
    annualMonthly: null,
    calls: "Custom",
    overage: "—",
    note: "Self-hosting and VPC, SLAs",
  },
];

const STRIP = ["Free models available", "Zero data retention available"];

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);

export function PricingSection() {
  const [annualBilling, setAnnualBilling] = useState(true);

  return (
    <div className={styles.pricingBand}>
      <section
        className={`${styles.section} ${styles.repairSection} ${styles.pricingSection}`}
        aria-labelledby="gateway-pricing"
      >
        <div className={styles.sectionLockup}>
          <div>
            <h2 id="gateway-pricing" className={styles.heading}>
              Built to scale
              <br />
              with your usage
            </h2>
          </div>
          <p className={styles.lead}>
            Each plan includes monthly API calls and all correction calls. Every response uses an
            API call plus LLM tokens. Tokens are billed separately at model provider rates.
          </p>
        </div>
        <div className={styles.diagram}>
          <div className={styles.pricingToolbar}>
            <div className={styles.pricingControls}>
              <button
                className={styles.billingToggle}
                type="button"
                role="switch"
                aria-label="Annual billing"
                aria-checked={annualBilling}
                onClick={() => setAnnualBilling((current) => !current)}
              >
                <span className={styles.billingTrack} aria-hidden="true" />
                <span>Annual billing</span>
              </button>
              <span className={styles.billingSaving}>Save up to 20%</span>
            </div>
            <ul className={styles.priceStrip}>
              {STRIP.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className={styles.pricingPanel}>
            <p className={styles.pricingCaption} aria-live="polite">
              Gateway plans.{" "}
              {annualBilling
                ? "Annual billing selected; prices shown per month."
                : "Monthly billing selected."}
            </p>
            <div className={styles.planGrid}>
              {PLANS.map((plan) => {
                const price = annualBilling ? plan.annualMonthly : plan.monthly;
                return (
                  <article
                    className={styles.planCard}
                    key={plan.name}
                    aria-labelledby={`gateway-plan-${plan.name.toLowerCase()}`}
                  >
                    <div className={styles.planHeader}>
                      <h3
                        id={`gateway-plan-${plan.name.toLowerCase()}`}
                        className={styles.planName}
                      >
                        {plan.name}
                      </h3>
                      <span className={styles.planPrice}>
                        {price === null
                          ? "Custom"
                          : price === 0
                            ? "$0"
                            : `${formatPrice(price)}/mo`}
                      </span>
                      {price !== null && price > 0 ? (
                        <span className={styles.pricingCaption}>
                          {annualBilling
                            ? `${formatPrice(price * 12)} billed annually`
                            : "Billed monthly"}
                        </span>
                      ) : null}
                    </div>
                    <dl className={styles.planFeatures}>
                      <div>
                        <dt>API calls/month</dt>
                        <dd>{plan.calls}</dd>
                      </div>
                      <div>
                        <dt>Overage</dt>
                        <dd>{plan.overage}</dd>
                      </div>
                      <div>
                        <dt>Includes</dt>
                        <dd>{plan.note}</dd>
                      </div>
                    </dl>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
        <div className={styles.linkRow}>
          <a className={styles.link} href="/pricing">
            View full pricing
          </a>
        </div>
      </section>
    </div>
  );
}
