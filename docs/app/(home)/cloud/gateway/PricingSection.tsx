import { MarketingTable } from "@/components/marketing-table";
import styles from "../sections.module.css";

/* Mirrors thesys.dev/pricing, which stays the upstream source of truth even
   though this page no longer links to it: this site is self-contained, so the
   reader is never sent off-site mid-funnel. Two places carry these numbers now,
   so a price change has to land in both. */
const PLANS = [
  { name: "Free", price: "$0", calls: "3K", overage: "—", note: "Bring your own LLM key" },
  { name: "Build", price: "$49/mo", calls: "25K", overage: "$0.002 / call", note: "Email support" },
  {
    name: "Grow",
    price: "$499/mo",
    calls: "500K",
    overage: "$0.001 / call",
    note: "SSO/SAML, priority support",
  },
  {
    name: "Scale",
    price: "Custom",
    calls: "Custom",
    overage: "—",
    note: "Self-hosting and VPC, SLAs",
  },
];

const STRIP = [
  "Free models available",
  "Zero data retention available",
  "Annual billing saves up to 20%",
];

export function PricingSection() {
  return (
    <section className={styles.section} aria-labelledby="gateway-pricing">
      <h2 id="gateway-pricing" className={styles.heading}>
        No markup on tokens
      </h2>
      <p className={styles.lead}>
        Every response uses API calls and LLM tokens. API calls are included in your plan. Tokens are
        billed separately at provider rates.
      </p>

      <div className={styles.tableWrap}>
        <MarketingTable edgeToEdgeMobile>
          <thead>
            <tr>
              <th scope="col">Plan</th>
              <th scope="col">API calls / month</th>
              <th scope="col">Overage</th>
              <th scope="col">Includes</th>
            </tr>
          </thead>
          <tbody>
            {PLANS.map((plan) => (
              <tr key={plan.name}>
                <th scope="row">
                  <span className={styles.planName}>{plan.name}</span>
                  <span className={styles.planPrice}>{plan.price}</span>
                </th>
                <td>{plan.calls}</td>
                <td>{plan.overage}</td>
                <td>{plan.note}</td>
              </tr>
            ))}
          </tbody>
        </MarketingTable>
      </div>

      <ul className={styles.priceStrip}>
        {STRIP.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <p className={styles.note}>
        Correction calls are included in your plan and are not billed separately.
      </p>
    </section>
  );
}
