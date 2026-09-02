"use client";

import { ArrowUpRight, Check } from "lucide-react";
import { useId, useState } from "react";
import { BevelButton } from "../../components/Button/BevelButton";
import { GATEWAY_PLANS } from "./gateway-plans";
import details from "./GatewayPlans.module.css";
import styles from "./sections.module.css";

const STRIP = ["Free models available", "Zero data retention available"];
const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);

/** Same plans, billing control, and card styling on both pricing surfaces. */
export function GatewayPlans({ detailed = false }: { detailed?: boolean }) {
  const [annualBilling, setAnnualBilling] = useState(true);
  const id = useId();

  return (
    <div className={detailed ? details.detailed : undefined}>
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
        <div className={`${styles.planGrid} ${detailed ? details.grid : ""}`}>
          {GATEWAY_PLANS.map((plan) => {
            const price = annualBilling ? plan.annualMonthly : plan.monthly;
            return (
              <article
                className={`${styles.planCard} ${detailed ? details.card : ""}`}
                key={plan.name}
                aria-labelledby={`${id}-${plan.name}`}
              >
                <div className={`${styles.planHeader} ${detailed ? details.header : ""}`}>
                  <h3 id={`${id}-${plan.name}`} className={styles.planName}>
                    {plan.name}
                  </h3>
                  <span className={styles.planPrice}>
                    {price === null ? "Custom" : price === 0 ? "$0" : `${formatPrice(price)}/mo`}
                  </span>
                  {price !== null && price > 0 ? (
                    <span className={detailed ? details.cadence : styles.pricingCaption}>
                      {annualBilling
                        ? `${formatPrice(price * 12)} billed annually`
                        : "Billed monthly"}
                    </span>
                  ) : detailed ? (
                    <span className={details.cadence} aria-hidden="true">
                      &nbsp;
                    </span>
                  ) : null}
                  {detailed && <p className={details.description}>{plan.description}</p>}
                </div>
                {detailed ? (
                  <>
                    <ul className={details.features}>
                      {plan.features.map((feature) => (
                        <li key={feature}>
                          <Check size={16} strokeWidth={1.75} aria-hidden="true" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className={details.action}>
                      <BevelButton
                        className={details.cta}
                        href={plan.href}
                        external
                        variant="primary"
                        label={plan.cta}
                        badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
                      />
                    </div>
                  </>
                ) : (
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
                )}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
