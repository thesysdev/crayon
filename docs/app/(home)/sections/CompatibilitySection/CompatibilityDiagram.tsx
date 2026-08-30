import { useId, type CSSProperties, type ReactNode } from "react";
import { StackChip, type StackChipItem } from "../../components/StackChip/StackChip";
import styles from "./CompatibilityDiagram.module.css";

type StackGroup = { label: string; items: StackChipItem[] };

// Anchors on the exported Figma rail, in its 480 × 210 visible area.
// The six-logo rail keeps every existing integration visible without clipping.
const LOGO_ANCHORS = {
  5: [
    [44, 46],
    [140, 46],
    [220, 46],
    [268.8, 105],
    [288, 178],
  ],
  6: [
    [44, 46],
    [116, 46],
    [188, 46],
    [266.85, 65.125],
    [268.8, 132],
    [306, 178],
  ],
};

export function CompatibilityDiagram({
  groups,
  description,
}: {
  groups: StackGroup[];
  description?: ReactNode;
}) {
  const id = useId();

  return (
    <div className={styles.diagram}>
      <div className={styles.card}>
        <h2 id="favorite-stack-title">Works with any stack</h2>
        {description && <p>{description}</p>}
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
          <span className={styles.connector} aria-hidden="true" />
          <h3 id={`${id}-${index}`} className={styles.category}>
            {group.label}
          </h3>
          <ul className={styles.logos}>
            {group.items.map((item, itemIndex) => {
              const anchors = LOGO_ANCHORS[group.items.length === 6 ? 6 : 5];
              const [x, y] = anchors[index < 2 ? itemIndex : anchors.length - 1 - itemIndex];
              return (
                <li
                  key={item.name}
                  style={
                    {
                      "--logo-x": `${(x / 480) * 100}%`,
                      "--logo-y": `${y}px`,
                    } as CSSProperties
                  }
                >
                  <StackChip item={{ ...item, isBlurred: false }} iconOnly />
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
