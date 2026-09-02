import { useId, type CSSProperties } from "react";
import { StackChip, type StackChipItem } from "../../components/StackChip/StackChip";
import styles from "./CompatibilityDiagram.module.css";

type StackGroup = { label: string; items: StackChipItem[] };

const CONNECTORS = [
  "M640 306H528C477 306 446 279 446 235C446 195 418 166 376 166H0",
  "M640 306H528C477 306 446 333 446 377C446 417 418 446 376 446H0",
  "M640 306H752C803 306 834 279 834 235C834 195 862 166 904 166H1280",
  "M640 306H752C803 306 834 333 834 377C834 417 862 446 904 446H1280",
];

export function CompatibilityDiagram({ groups }: { groups: StackGroup[] }) {
  const id = useId();

  return (
    <div className={styles.diagram}>
      <svg
        className={styles.network}
        viewBox="0 0 1280 612"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <g className={styles.rails}>
          {CONNECTORS.map((path) => (
            <path key={path} d={path} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
        <g className={styles.pulses}>
          {CONNECTORS.map((path, index) => (
            <path
              key={path}
              d={path}
              pathLength="1"
              vectorEffect="non-scaling-stroke"
              style={{ "--pulse-delay": `${index * -1.4}s` } as CSSProperties}
            />
          ))}
        </g>
      </svg>

      <div className={styles.card}>
        <div className={styles.cardInner}>
          <h2 id="favorite-stack-title">Works with any stack</h2>
        </div>
      </div>

      {groups.map((group, index) => (
        <div
          key={group.label}
          className={styles.branch}
          data-side={index < 2 ? "left" : "right"}
          data-row={index % 2 === 0 ? "top" : "bottom"}
          role="group"
          aria-labelledby={`${id}-${index}`}
        >
          <h3 id={`${id}-${index}`} className={styles.category}>
            {group.label}
          </h3>
          <ul className={styles.logos}>
            {group.items.slice(0, 4).map((item) => (
              <li key={item.name}>
                <StackChip item={{ ...item, isBlurred: false }} iconOnly />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
