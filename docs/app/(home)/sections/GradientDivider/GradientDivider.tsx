import styles from "./GradientDivider.module.css";

const BAR_HEIGHT_CLASSES = [
  styles.barHeight60,
  styles.barHeight48,
  styles.barHeight32,
  styles.barHeight20942,
  styles.barHeight16754,
  styles.barHeight12565,
  styles.barHeight10471,
  styles.barHeight8377,
  styles.barHeight6283,
  styles.barHeight4188,
  styles.barHeight3141,
  styles.barHeight2094,
  styles.barHeight1047,
];

export function GradientDivider({
  direction = "down",
  compact = false,
}: {
  direction?: "down" | "up";
  compact?: boolean;
}) {
  const source = compact ? BAR_HEIGHT_CLASSES.slice(2) : BAR_HEIGHT_CLASSES;
  const bars = direction === "up" ? [...source].reverse() : source;

  return (
    <div className={styles.divider}>
      {bars.map((barClassName) => (
        <div key={barClassName} className={`${styles.bar} ${barClassName}`.trim()} />
      ))}
    </div>
  );
}
