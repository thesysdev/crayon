import styles from "./DeviceStatusBar.module.css";

/* Signal and battery geometry shared with PD's OUI-1 hero.html status bar. */
export function DeviceStatusBar({ className = "" }: { className?: string }) {
  return (
    <div className={`${styles.status} ${className}`} aria-hidden="true">
      <span>9:41</span>
      <span className={styles.system}>
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
          <rect x="0" y="7.5" width="3" height="3.5" rx="1" />
          <rect x="4.5" y="5.5" width="3" height="5.5" rx="1" />
          <rect x="9" y="3" width="3" height="8" rx="1" />
          <rect x="13.5" y="0" width="3" height="11" rx="1" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12">
          <rect
            x=".6"
            y=".6"
            width="20.8"
            height="10.8"
            rx="3.4"
            fill="none"
            stroke="currentColor"
            strokeOpacity=".35"
            strokeWidth="1.2"
          />
          <rect x="2.4" y="2.4" width="14.5" height="7.2" rx="2" fill="currentColor" />
          <path d="M23 4.3v3.4a2 2 0 0 0 0-3.4z" fill="currentColor" fillOpacity=".35" />
        </svg>
      </span>
    </div>
  );
}
