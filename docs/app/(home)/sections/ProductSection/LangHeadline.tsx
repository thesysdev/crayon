import { ChartColumn, LayoutDashboard, Table2, TextCursorInput } from "lucide-react";
import { ShufflingWord } from "../../components/ShufflingWord/ShufflingWord";
import styles from "./LangHeadline.module.css";

/* The parked hero outcome line, reused as the open-source band's headline:
   the last word cycles through what an agent can answer with. "with" stays
   put, since the left-aligned heading has no centre to keep it in. */
const AGENT_OUTPUTS = [
  { label: "Interactive UI" },
  { label: "Charts", icon: <ChartColumn aria-hidden /> },
  { label: "Tables", icon: <Table2 aria-hidden /> },
  { label: "Forms", icon: <TextCursorInput aria-hidden /> },
  { label: "Dashboards", icon: <LayoutDashboard aria-hidden /> },
];

export function LangHeadline() {
  return (
    <span className={styles.heading}>
      <span className={styles.line}>Make your AI apps and agents</span>
      <span className={styles.line}>
        respond with{" "}
        <span className={styles.shuffle}>
          <ShufflingWord items={AGENT_OUTPUTS} />
        </span>
      </span>
    </span>
  );
}
