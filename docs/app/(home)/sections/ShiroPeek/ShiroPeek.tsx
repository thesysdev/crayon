import styles from "./ShiroPeek.module.css";

export function ShiroPeek() {
  return (
    <div className={styles.root}>
      <div className={styles.figure}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.svg} src="/shiro-peek.svg" alt="" aria-hidden="true" />
      </div>
    </div>
  );
}
