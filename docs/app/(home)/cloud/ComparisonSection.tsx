import { MarketingTable } from "@/components/marketing-table";
import styles from "./ComparisonSection.module.css";

const COMPARISON_ROWS = [
  ["OpenUI Lang", "Included", "Included"],
  ["Model providers", "Manage yourself", "One API across supported providers, at cost"],
  ["Data persistence", "Implement yourself", "Built in"],
  ["Fallbacks", "Manage yourself", "Built in"],
  ["Output validation & correction", "Implement yourself", "Built in"],
  ["Slides, reports and dashboards", "Implement yourself", "Production-ready artifact generation"],
  ["Infrastructure", "Manage yourself", "Fully managed"],
  ["Scaling and reliability", "Manage yourself", "Fully managed"],
  ["Observability", "Implement yourself", "Built-in production visibility"],
  [
    "UI Library",
    "Basic components included",
    "Production-tested, responsive components built for generative UI",
  ],
] as const;

function CloudCheckmark() {
  return (
    <svg
      className={styles.cloudCheckmark}
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="20" height="20" rx="10" fill="#049156" />
      <path
        d="M14.6668 6.5L8.25016 12.9167L5.3335 10"
        stroke="white"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ComparisonSection() {
  return (
    <section className={styles.section} aria-labelledby="cloud-comparison-title">
      <div className={styles.separator} aria-hidden="true" />
      <div className={styles.inner}>
        <h2 id="cloud-comparison-title" className={styles.title}>
          Purpose
          <br className={styles.titleBreak} /> built for
          <br className={styles.mobileTitleBreak} /> production use-cases
        </h2>

        <MarketingTable edgeToEdgeMobile>
          <colgroup>
            <col className={styles.capabilityColumn} />
            <col />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Capability</th>
              <th scope="col">OpenUI OSS</th>
              <th scope="col">OpenUI Cloud</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map(([capability, oss, cloud]) => (
              <tr key={capability}>
                <th scope="row">{capability}</th>
                <td
                  className={
                    oss === "Manage yourself" ||
                    oss === "Implement yourself" ||
                    oss === "Basic components included"
                      ? styles.selfManaged
                      : undefined
                  }
                >
                  {capability === "OpenUI Lang" ? (
                    <span className={styles.checkedValue}>
                      <CloudCheckmark />
                      <span>{oss}</span>
                    </span>
                  ) : (
                    oss
                  )}
                </td>
                <td>
                  <span className={styles.checkedValue}>
                    <CloudCheckmark />
                    <span>{cloud}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </MarketingTable>
      </div>
    </section>
  );
}
