import { CaretRight, Star } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import {
  IllustratedFeature,
  IllustratedFeatures,
} from "../components/IllustratedFeatures/IllustratedFeatures";
import styles from "./AppLessFeatures.module.css";

/* Each illustration is a fixed 384x280 composition that scales to the height of
   its stage and sits centred in it. */

/* ---------- Just ask ---------- */
function AskIllustration() {
  return (
    <div className={`${styles.scene} ${styles.sceneSmall}`} aria-hidden="true">
      <div className={styles.ask}>
        <i className={styles.askAvatar}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="5.5" r="2.9" />
            <path d="M2.7 14.2c0-3 2.4-5.1 5.3-5.1s5.3 2.1 5.3 5.1z" />
          </svg>
        </i>
        <span className={styles.askBubble}>Book a table for two at 8pm</span>
      </div>
      <div className={styles.askScreen}>
        <div className={styles.askHero}>
          <Image
            className={styles.askPhoto}
            src="/appless/demo-pizza.jpg"
            alt=""
            width={560}
            height={208}
          />
          <div className={styles.askHead}>
            <span className={styles.screenTitle}>Luigi’s Hearth</span>
            <span className={styles.askHeadMeta}>
              4.7 <Star size={11} weight="fill" /> · $$
            </span>
          </div>
        </div>
        <div className={styles.askBody}>
          <div className={styles.askChips}>
            <span>2 guests</span>
            <span>8:00 pm</span>
            <span>Tonight</span>
          </div>
          <span className={styles.screenButton}>Confirm</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Native on your phone ---------- */
// The Apple mark as published by Simple Icons (24x24). The Material Design
// mark is drawn solid from the same geometry: disc, square, triangle.
const PLATFORMS = [
  {
    id: "ios",
    name: "Cupertino",
    mark: "M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701",
  },
  { id: "material", name: "Material Design", mark: null },
];

function NativeIllustration() {
  return (
    /* A loose stack of two white cards, one per platform: its mark, and its
       name beneath. */
    <div className={styles.scene} aria-hidden="true">
      {PLATFORMS.map((platform) => (
        <div key={platform.id} className={styles.platformCard} data-platform={platform.id}>
          <svg className={styles.platformMark} width="40" height="40" viewBox="0 0 24 24">
            <defs>
              {/* a soft shadow just inside the top edge, so the mark sits pressed in */}
              <filter id={`inset-${platform.id}`} x="-10%" y="-10%" width="120%" height="120%">
                <feComponentTransfer in="SourceAlpha">
                  <feFuncA type="table" tableValues="1 0" />
                </feComponentTransfer>
                <feGaussianBlur stdDeviation="0.5" />
                <feOffset dy="0.6" result="shade" />
                <feFlood floodColor="#000" floodOpacity="0.16" />
                <feComposite in2="shade" operator="in" />
                <feComposite in2="SourceAlpha" operator="in" result="inner" />
                <feMerge>
                  <feMergeNode in="SourceGraphic" />
                  <feMergeNode in="inner" />
                </feMerge>
              </filter>
              <clipPath id="material-disc">
                <circle cx="12" cy="12" r="12" />
              </clipPath>
            </defs>
            {platform.mark ? (
              <path d={platform.mark} filter={`url(#inset-${platform.id})`} />
            ) : (
              <g filter={`url(#inset-${platform.id})`} clipPath="url(#material-disc)">
                <circle cx="12" cy="12" r="12" />
                <path className={styles.platformMarkMid} d="M3.6 0h16.8v24H3.6z" />
                <path className={styles.platformMarkTop} d="M3.6 3.6h16.8L12 20.4z" />
              </g>
            )}
          </svg>
          <span>{platform.name}</span>
        </div>
      ))}
    </div>
  );
}

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
  // connector runs: from the row's right edge to the card's left edge.
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
            {rail(156, option.from, option.from === option.to ? 222 : 250, option.to, 188).map(
              (arrow, i) => (
                <path key={i} d="M-1.5 -2.5 1 0-1.5 2.5" {...arrow} />
              ),
            )}
          </g>
        ))}
      </svg>
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
        <AskIllustration />
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
