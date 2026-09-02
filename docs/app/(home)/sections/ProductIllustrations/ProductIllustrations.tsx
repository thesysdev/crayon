import { Check, X } from "@phosphor-icons/react/dist/ssr";
import styles from "./ProductIllustrations.module.css";

export { OpenSourceIllustration } from "./OpenSourceIllustration";

export function GatewayReliabilityIllustration() {
  return (
    <div
      className={styles.simpleGateway}
      role="img"
      aria-label="OpenUI Gateway validates a streaming response, repairs an invalid chart reference, and delivers the completed revenue interface."
    >
      <svg className={styles.gatewayRoutes} viewBox="0 0 1280 520" aria-hidden="true">
        <path
          className={styles.route}
          d="M455 392 C605 392 628 310 760 280 C835 263 850 224 850 180"
        />
        <path
          className={styles.route}
          d="M480 432 C648 432 675 350 760 326 C866 296 900 238 900 180"
        />
        <path
          className={styles.route}
          d="M430 350 C565 350 584 270 704 242 C770 227 798 206 798 180"
        />
        <circle className={styles.routePulse} r="3">
          <animateMotion
            dur="5.6s"
            begin="-1.2s"
            repeatCount="indefinite"
            path="M455 392 C605 392 628 310 760 280 C835 263 850 224 850 180"
          />
        </circle>
        <circle className={styles.routePulse} r="3">
          <animateMotion
            dur="6.2s"
            begin="-3.8s"
            repeatCount="indefinite"
            path="M480 432 C648 432 675 350 760 326 C866 296 900 238 900 180"
          />
        </circle>
        <circle className={styles.routePulse} r="3">
          <animateMotion
            dur="5.9s"
            begin="-4.9s"
            repeatCount="indefinite"
            path="M430 350 C565 350 584 270 704 242 C770 227 798 206 798 180"
          />
        </circle>
      </svg>

      <div className={styles.gatewayChecks}>
        <div className={styles.gatewayCheckHeader}>
          <span className={styles.gatewayMark}>O</span>
          <span>
            <strong>OpenUI Gateway</strong>
            <small>Validating streamed output</small>
          </span>
          <span className={styles.liveStatus}>Live</span>
        </div>
        <div className={styles.gatewayCheckRows}>
          <span>
            <i className={styles.checkState} aria-hidden="true">
              <Check size={10} weight="bold" />
            </i>
            <b>Component</b>
            <code>LineChart</code>
          </span>
          <span className={styles.failedCheck}>
            <i className={styles.errorState} aria-hidden="true">
              <X size={10} weight="bold" />
            </i>
            <b>Reference</b>
            <code>series=&quot;revenue&quot;</code>
          </span>
          <span>
            <i className={styles.checkState} aria-hidden="true">
              <Check size={10} weight="bold" />
            </i>
            <b>Repair</b>
            <code>series=&#123;revenue&#125;</code>
          </span>
        </div>
      </div>

      <span className={`${styles.routeChip} ${styles.validateChip}`}>Validate</span>
      <span className={`${styles.routeChip} ${styles.repairChip}`}>1 chunk repaired</span>
      <span className={`${styles.routeChip} ${styles.streamChip}`}>Stream continues</span>

      <div className={styles.renderedResponse}>
        <div className={styles.responseHeader}>
          <span>
            <small>Revenue overview</small>
            <strong>$2.15M</strong>
          </span>
          <span className={styles.deliveredBadge}>
            <Check size={10} weight="bold" />
            Delivered
          </span>
        </div>
        <div className={styles.responseChart} aria-hidden="true">
          <span className={styles.chartGrid} />
          <svg viewBox="0 0 360 112" preserveAspectRatio="none">
            <path d="M0 88 C48 80 73 58 116 65 S181 78 222 48 S301 47 360 18" />
          </svg>
        </div>
        <div className={styles.responseFooter}>
          <span>All regions</span>
          <span>Last 6 months</span>
        </div>
      </div>
    </div>
  );
}
