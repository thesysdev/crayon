import {
  ArrowRight,
  BracketsCurly,
  Browser,
  ChatCircleText,
  CheckCircle,
  ShieldCheck,
  Wrench,
} from "@phosphor-icons/react/dist/ssr";
import styles from "./GatewayDiagram.module.css";

function FlowArrow() {
  return (
    <span className={styles.flowArrow} aria-hidden="true">
      <ArrowRight size={16} weight="bold" />
    </span>
  );
}

export function GatewayDiagram() {
  return (
    <div
      className={styles.stage}
      role="img"
      aria-label="A component schema and model response enter OpenUI Gateway. Valid output streams to the OpenUI runtime. Invalid output is repaired and the corrected delta streams to the runtime."
    >
      <div className={styles.sources}>
        <div className={styles.sourceCard}>
          <span className={styles.iconTile} aria-hidden="true">
            <BracketsCurly size={20} weight="light" />
          </span>
          <span>
            <strong>Component schema</strong>
            <small>Your allowed UI primitives</small>
          </span>
        </div>
        <div className={styles.sourceCard}>
          <span className={styles.iconTile} aria-hidden="true">
            <ChatCircleText size={20} weight="light" />
          </span>
          <span>
            <strong>Model response</strong>
            <small>The generated OpenUI stream</small>
          </span>
        </div>
      </div>

      <FlowArrow />

      <div className={styles.gateway}>
        <div className={styles.gatewayHeader}>
          <span className={styles.gatewayMark} aria-hidden="true">
            <ShieldCheck size={20} weight="light" />
          </span>
          <span>
            <strong>OpenUI Gateway</strong>
            <small>Validate against your schema</small>
          </span>
        </div>

        <div className={styles.routes}>
          <div className={styles.route}>
            <CheckCircle size={18} weight="fill" aria-hidden="true" />
            <span>
              <strong>Valid</strong>
              <small>Continue streaming</small>
            </span>
          </div>
          <div className={`${styles.route} ${styles.repairRoute}`}>
            <Wrench size={18} weight="fill" aria-hidden="true" />
            <span>
              <strong>Invalid</strong>
              <small>Repair the broken node and stream the delta</small>
            </span>
          </div>
        </div>
      </div>

      <FlowArrow />

      <div className={styles.outputCard}>
        <span className={styles.outputIcon} aria-hidden="true">
          <Browser size={22} weight="light" />
        </span>
        <span>
          <strong>OpenUI runtime</strong>
          <small>Reliable UI reaches the user</small>
        </span>
      </div>
    </div>
  );
}
