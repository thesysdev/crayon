import styles from "./OuiFeatures.module.css";

// Daily revenue in $k for a 30-day month. The total and the bar heights are
// derived from it.
const MONTH = [
  4.2, 5.1, 4.8, 6.3, 7.4, 8.1, 5.6, 4.6, 5.4, 5.0, 6.8, 7.9, 8.8, 6.1, 4.9, 5.9, 5.3, 7.2, 8.3,
  9.6, 6.6, 5.2, 6.1, 5.7, 7.5, 8.6, 9.1, 6.9, 5.5, 6.4,
];
const AXIS_MAX = 10;

/* The response both device illustrations show: a month of revenue as a bar
   chart. `animated` plays it arriving in step with the stream scene; without
   it the card is still. */
export function RevenueCard({ animated }: { animated?: boolean }) {
  const month = MONTH;
  const total = month.reduce((sum, v) => sum + v, 0).toFixed(1);
  const peak = Math.max(...month);

  return (
    <div
      className={
        animated
          ? `${styles.streamBlock} ${styles.chartCard} ${styles.streamC}`
          : `${styles.chartCard} ${styles.chartCardStill}`
      }
    >
      <div className={styles.chartCardHead}>
        <span className={styles.chartCardTitle}>Monthly revenue</span>
      </div>
      <div className={styles.chartCardTotal}>
        <b>${total}k</b>
        <span className={styles.chartCardDelta}>+12%</span>
        <i>vs August</i>
      </div>
      <div className={styles.plot}>
        <div className={styles.plotAxis}>
          {[AXIS_MAX, AXIS_MAX / 2, 0].map((tick) => (
            <span key={tick}>${tick}k</span>
          ))}
        </div>
        <div className={styles.streamBars}>
          {month.map((v, i) => (
            <span key={i} className={styles.barSlot}>
              {v === peak && (
                <em className={styles.barValue} style={{ bottom: `${(v / AXIS_MAX) * 100}%` }}>
                  ${v}k
                </em>
              )}
              <span
                className={styles.bar}
                style={{ height: `${(v / AXIS_MAX) * 100}%`, animationDelay: `${i * 20}ms` }}
              />
            </span>
          ))}
        </div>
      </div>
      <div className={styles.streamDays}>
        {month.map((_, i) => (
          <span key={i}>{i % 7 === 0 ? `Sep ${i + 1}` : ""}</span>
        ))}
      </div>
    </div>
  );
}

/* The query, the reply and the chart arrive in turn, on a loop. */
export function DeviceScene() {
  return (
    /* The same device the hero uses, set off-centre so the stage crops its
       right and bottom edges. The scene is a fixed 588x360 composition that
       scales with the stage rather than reflowing. */
    <div className={styles.streamScene} aria-hidden="true">
      <div className={styles.device}>
        <div className={styles.screen}>
          <div className={`${styles.streamBlock} ${styles.chatRow} ${styles.streamA}`}>
            <i className={`${styles.avatar} ${styles.avatarUser}`}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="5.5" r="2.9" />
                <path d="M2.7 14.2c0-3 2.4-5.1 5.3-5.1s5.3 2.1 5.3 5.1z" />
              </svg>
            </i>
            <span className={`${styles.bubble} ${styles.bubbleUser}`}>
              How was revenue last month?
            </span>
          </div>
          <div className={`${styles.streamBlock} ${styles.chatRow} ${styles.streamB}`}>
            <i className={`${styles.avatar} ${styles.avatarAi}`}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1.4 9.6 5.9 14.2 7.5 9.6 9.1 8 13.6 6.4 9.1 1.8 7.5 6.4 5.9z" />
              </svg>
            </i>
            <span className={styles.bubble}>Here’s September, day by day.</span>
          </div>
          <RevenueCard animated />
        </div>
      </div>
    </div>
  );
}
