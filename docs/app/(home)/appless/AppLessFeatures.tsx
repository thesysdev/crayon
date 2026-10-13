import { CaretRight, Star } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import {
  IllustratedFeature,
  IllustratedFeatures,
} from "../components/IllustratedFeatures/IllustratedFeatures";
import styles from "./AppLessFeatures.module.css";

import { NativeIllustration } from "./NativeIllustration";
import { RequestIllustration } from "./RequestIllustration";

/* ---------- Keep exploring ---------- */
function ExploreIllustration() {
  // Invented listings; the photos are credited in public/appless/photo-credits.txt.
  const hotels = [
    ["The Larch House", "4.8", "$182 a night", "larch"],
    ["Harbor Loft", "4.6", "$149 a night", "harbor"],
    ["Casa Verde", "4.7", "$165 a night", "casa"],
    ["Palm Court", "4.5", "$210 a night", "palm"],
    ["Old Mill Inn", "4.9", "$128 a night", "mill"],
  ];
  return (
    /* A button running off the left edge, and the screen it leads to running
       off the right. */
    <div className={`${styles.scene} ${styles.sceneSmall}`} aria-hidden="true">
      <span className={styles.searchButton}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="5.2" cy="5.2" r="3.4" stroke="currentColor" strokeWidth="1.4" />
          <path d="m7.8 7.8 2.6 2.6" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        Search
      </span>
      {/* a still rail of arrows from the tap to the screen it opens */}
      <span className={styles.exploreLink}>
        {Array.from({ length: 7 }, (_, i) => (
          <CaretRight key={i} size={8} weight="bold" style={{ opacity: 0.25 + i * 0.1 }} />
        ))}
      </span>
      <div className={styles.hotelScreen}>
        <span className={styles.screenTitle}>Hotels nearby</span>
        {hotels.map(([name, rating, price, photo]) => (
          <div key={name} className={styles.hotel}>
            <Image
              className={styles.hotelPhoto}
              src={`/appless/hotel-${photo}.jpg`}
              alt=""
              width={72}
              height={72}
            />
            <span>
              <b>{name}</b>
              <small>
                {rating} <Star size={11} weight="fill" /> · {price}
              </small>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Instant next screens ---------- */
// A still rail of arrows along a right-angled route with soft corners: out
// from (x0, y0), along a vertical at `mid`, in to (x1, y1). A level pair is a
// straight run. Returns where each arrow sits and which way it points.
const RAIL_STEP = 14;
function rail(x0: number, y0: number, x1: number, y1: number, mid: number) {
  const dir = y1 > y0 ? 1 : -1;
  const r = Math.min(16, Math.abs(y1 - y0) / 2);
  const arc = (Math.PI / 2) * r;
  // the route as lengths: run, corner, drop, corner, run
  const legs =
    y0 === y1 ? [x1 - x0] : [mid - r - x0, arc, Math.abs(y1 - y0) - 2 * r, arc, x1 - mid - r];
  const total = legs.reduce((sum, leg) => sum + leg, 0);
  const at = (d: number) => {
    if (legs.length === 1) return { x: x0 + d, y: y0, angle: 0 };
    if (d <= legs[0]) return { x: x0 + d, y: y0, angle: 0 };
    d -= legs[0];
    if (d <= arc) {
      const a = d / r;
      return { x: mid - r + r * Math.sin(a), y: y0 + dir * r * (1 - Math.cos(a)), angle: dir * a };
    }
    d -= arc;
    if (d <= legs[2]) return { x: mid, y: y0 + dir * (r + d), angle: (dir * Math.PI) / 2 };
    d -= legs[2];
    if (d <= arc) {
      const a = d / r;
      return {
        x: mid + r * (1 - Math.cos(a)),
        y: y1 - dir * r * (1 - Math.sin(a)),
        angle: dir * (Math.PI / 2 - a),
      };
    }
    d -= arc;
    return { x: mid + r + d, y: y1, angle: 0 };
  };
  const count = Math.floor((total - RAIL_STEP / 2) / RAIL_STEP) + 1;
  return Array.from({ length: count }, (_, i) => {
    const d = RAIL_STEP / 2 + i * RAIL_STEP;
    const { x, y, angle } = at(d);
    return {
      transform: `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${((angle * 180) / Math.PI).toFixed(1)})`,
      // fades out toward the list it leaves, full by the screen it leads to
      opacity: Number((d / total).toFixed(2)),
    };
  });
}

function LightspeedIllustration() {
  // Each option in the list, the screen prefetched for it, and where its
  // connector runs from the shared timing pill to the card's left edge.
  const options = [
    { name: "The Larch House", price: "$182 a night", photo: "larch", from: 106, to: 31 },
    { name: "Harbor Loft", price: "$149 a night", photo: "harbor", from: 140, to: 140 },
    { name: "Casa Verde", price: "$165 a night", photo: "casa", from: 174, to: 253 },
  ];
  return (
    /* A list on the left, and on the right the screen behind every option,
       already loaded. The middle one is in view; the other two sit further
       right and run off the top and bottom of the stage. */
    <div className={`${styles.scene} ${styles.sceneSmall}`} aria-hidden="true">
      <div className={styles.fromScreen}>
        <span className={styles.screenTitle}>Hotels nearby</span>
        {options.map((option) => (
          <div key={option.name} className={styles.fromRow}>
            {option.name}
            <CaretRight size={11} weight="bold" />
          </div>
        ))}
      </div>
      <svg className={styles.connectors} viewBox="0 0 384 280" fill="none">
        {options.map((option) => (
          // the outer two sit back; the rail to the screen in view leads
          <g key={option.name} opacity={option.from === option.to ? 1 : 0.5}>
            {rail(156, 140, option.from === option.to ? 222 : 250, option.to, 190).map(
              (arrow, i) => (
                <path key={i} d="M-1.5 -2.5 1 0-1.5 2.5" {...arrow} />
              ),
            )}
          </g>
        ))}
      </svg>
      <span className={styles.timingChip}>0 ms</span>
      {options.map((option, i) => (
        <div key={option.name} className={styles.toScreen} data-slot={i}>
          <Image
            className={styles.toPhoto}
            src={`/appless/hotel-${option.photo}.jpg`}
            alt=""
            width={288}
            height={288}
          />
          <div className={styles.toBody}>
            <span className={styles.screenTitle}>{option.name}</span>
            <span className={styles.toMeta}>{option.price}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AppLessFeatures() {
  return (
    <IllustratedFeatures>
      <IllustratedFeature
        span="half"
        title="Just ask"
        description="From a weather dashboard to a booking form, describe the task and watch the screen appear."
      >
        <RequestIllustration />
      </IllustratedFeature>
      <IllustratedFeature
        span="half"
        title="Keep exploring"
        description="Tap a row, button, or card to generate the next screen."
      >
        <ExploreIllustration />
      </IllustratedFeature>
      <IllustratedFeature
        span="half"
        title="Instant next screens"
        description="Prefetch makes the next likely screen appear at lightspeed."
      >
        <LightspeedIllustration />
      </IllustratedFeature>
      <IllustratedFeature
        span="half"
        title="Native on your phone"
        description="Interactive components render as Cupertino on iOS and Material 3 on Android."
      >
        <NativeIllustration />
      </IllustratedFeature>
    </IllustratedFeatures>
  );
}
