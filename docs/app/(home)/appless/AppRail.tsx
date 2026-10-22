import {
  AirplaneTilt,
  Bank,
  CalendarBlank,
  Camera,
  Car,
  ChatCircle,
  CloudSun,
  CreditCard,
  Envelope,
  ForkKnife,
  GameController,
  Heartbeat,
  MapPin,
  MusicNotes,
  Newspaper,
  ShoppingCart,
} from "@phosphor-icons/react/dist/ssr";
import styles from "./AppRail.module.css";

const APPS = [
  ChatCircle,
  Camera,
  MapPin,
  MusicNotes,
  ShoppingCart,
  Envelope,
  CalendarBlank,
  CloudSun,
  CreditCard,
  Car,
  ForkKnife,
  AirplaneTilt,
  Heartbeat,
  Newspaper,
  GameController,
  Bank,
];

/* A rail of app icons drifting past a centre line. The same track is drawn
   twice in step, each clipped to one side of the line: whole before it, and
   faded with a strike through each icon after it. */
export function AppRail() {
  return (
    <div className={styles.rail} aria-hidden="true">
      {(["live", "struck"] as const).map((state) => (
        <div key={state} className={styles.side} data-state={state}>
          <div className={styles.track}>
            {/* two copies, so the loop has no seam */}
            {[0, 1].map((copy) =>
              APPS.map((Icon, i) => (
                <span key={`${copy}-${i}`} className={styles.app}>
                  <Icon size={28} weight="fill" />
                </span>
              )),
            )}
          </div>
        </div>
      ))}
      <i className={styles.line} />
    </div>
  );
}
