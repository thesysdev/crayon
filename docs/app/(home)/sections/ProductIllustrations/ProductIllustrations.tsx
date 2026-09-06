import Image from "next/image";
import styles from "./ProductIllustrations.module.css";

export { OpenSourceIllustration } from "./OpenSourceIllustration";

export function GatewayReliabilityDashboardIllustration({
  inverted = false,
  alt = "OpenUI Gateway reliability dashboard showing successful renders, errors, sanitizer triggers, and model fallbacks",
}: {
  inverted?: boolean;
  alt?: string;
}) {
  return (
    <div
      className={`${styles.reliabilityDashboardIllustration} ${
        inverted ? styles.reliabilityDashboardIllustrationInverted : ""
      }`.trim()}
    >
      <Image
        className={`${styles.reliabilityDashboardImage} ${styles.reliabilityDashboardImageLight}`}
        src="/images/gateway/reliability-light@3x.png"
        alt={alt}
        width={3408}
        height={1596}
        unoptimized
      />
      <Image
        className={`${styles.reliabilityDashboardImage} ${styles.reliabilityDashboardImageDark}`}
        src="/images/gateway/reliability-dark@3x.png"
        alt=""
        aria-hidden="true"
        width={3408}
        height={1596}
        unoptimized
      />
    </div>
  );
}

type ResponseTone = "valid" | "root" | "reference" | "type";

const responseLanes = [
  {
    path: "M -28 96 H 86 C 118 96 126 106 142 128 S 170 160 198 160 H 218 C 244 160 246 190 266 204 S 290 218 305 222",
  },
  {
    path: "M -28 176 H 92 C 126 176 132 188 150 206 S 178 226 206 226 H 226 C 252 226 268 238 305 242",
  },
  { path: "M -28 260 H 110 C 144 260 152 244 178 244 H 208 C 234 244 254 260 305 260" },
  {
    path: "M -28 344 H 92 C 126 344 132 332 150 314 S 178 294 206 294 H 226 C 252 294 268 282 305 280",
  },
  {
    path: "M -28 424 H 86 C 118 424 126 414 142 392 S 170 360 198 360 H 218 C 244 360 246 330 266 316 S 290 302 305 300",
  },
] as const;

const validatedLanes = [
  { path: "M 568 236 H 606 C 642 236 642 186 676 186 H 1120" },
  { path: "M 568 260 H 624 C 648 260 654 260 676 260 H 1120" },
  { path: "M 568 284 H 606 C 642 284 642 334 676 334 H 1120" },
] as const;

const mobileResponseLanes = [
  { path: "M 42 -24 V 34 C 42 74 76 76 76 112 C 76 150 116 160 154 210" },
  { path: "M 116 -24 V 54 C 116 88 142 96 142 128 C 142 164 166 176 176 210" },
  { path: "M 195 -24 V 210" },
  { path: "M 274 -24 V 54 C 274 88 248 96 248 128 C 248 164 224 176 214 210" },
  { path: "M 348 -24 V 34 C 348 74 314 76 314 112 C 314 150 274 160 236 210" },
] as const;

const mobileValidatedLanes = [
  { path: "M 160 362 V 382 C 160 404 128 406 128 434 V 640" },
  { path: "M 195 362 V 640" },
  { path: "M 230 362 V 382 C 230 404 262 406 262 434 V 640" },
] as const;

const incomingResponses: Array<{ lane: number; delay: number; tone: ResponseTone }> = [
  { lane: 0, delay: -0.2, tone: "valid" },
  { lane: 0, delay: -2.4, tone: "root" },
  { lane: 0, delay: -4.6, tone: "valid" },
  { lane: 1, delay: -0.8, tone: "reference" },
  { lane: 1, delay: -3, tone: "valid" },
  { lane: 1, delay: -5.2, tone: "type" },
  { lane: 2, delay: -1.4, tone: "type" },
  { lane: 2, delay: -3.6, tone: "valid" },
  { lane: 2, delay: -5.8, tone: "root" },
  { lane: 3, delay: -2, tone: "valid" },
  { lane: 3, delay: -4.2, tone: "reference" },
  { lane: 3, delay: -6.4, tone: "valid" },
  { lane: 4, delay: -0.5, tone: "valid" },
  { lane: 4, delay: -2.7, tone: "root" },
  { lane: 4, delay: -4.9, tone: "valid" },
];

const validatedResponses = incomingResponses.map((_, index) => ({
  lane: index % validatedLanes.length,
  delay: -index * 0.44,
}));

const slotValues = {
  fixed: ["08", "09", "10", "11", "12", "13"],
  checked: ["143", "144", "145", "146", "147", "148"],
  delivered: ["143", "144", "145", "146", "147", "148"],
};

export function GatewayReliabilityIllustration() {
  return (
    <div
      className={styles.responseFlowHero}
      role="img"
      aria-label="Model output streams fifteen complete responses through OpenUI Gateway. Gateway checks every response, fixes four kinds of output errors, and delivers the same fifteen valid responses to a rendered analytics interface."
    >
      <ResponsePaths />
      <ResponsePaths mobile />

      <div className={styles.modelOutputLabel} aria-hidden="true">
        <span>MODEL OUTPUT</span>
        <small>Each marker is one response</small>
      </div>

      <div className={styles.responseGatewayNode} aria-hidden="true">
        <div className={styles.gatewayHeader}>
          <span>OPENUI GATEWAY</span>
          <span className={styles.fixedCount}>
            <Slot values={slotValues.fixed} />
            <small>FIXED</small>
          </span>
        </div>
        <div className={styles.gatewayMetrics}>
          <GatewayMetric label="RESPONSES CHECKED" values={slotValues.checked} tone="neutral" />
          <GatewayMetric label="ERROR TYPES FIXED" value="4" tone="error" />
          <GatewayMetric label="RESPONSES DELIVERED" values={slotValues.delivered} tone="valid" />
        </div>
      </div>

      <div className={styles.renderedInterface} aria-hidden="true">
        <Image
          className={styles.renderedInterfaceLight}
          src="/images/gateway/rendered-ui-light@3x.png"
          alt=""
          width={1716}
          height={1367}
          unoptimized
        />
        <Image
          className={styles.renderedInterfaceDark}
          src="/images/gateway/rendered-ui-dark@3x.png"
          alt=""
          width={1716}
          height={1367}
          unoptimized
        />
      </div>
    </div>
  );
}

function ResponsePaths({ mobile = false }: { mobile?: boolean }) {
  const incomingLanes = mobile ? mobileResponseLanes : responseLanes;
  const outgoingLanes = mobile ? mobileValidatedLanes : validatedLanes;

  return (
    <svg
      className={`${styles.gatewayPaths} ${
        mobile ? styles.gatewayPathsMobile : styles.gatewayPathsDesktop
      }`}
      viewBox={mobile ? "0 0 390 620" : "0 0 1280 520"}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {incomingLanes.map((lane, index) => (
        <path d={lane.path} key={`incoming-line-${index}`} />
      ))}
      {outgoingLanes.map((lane, index) => (
        <path d={lane.path} key={`outgoing-line-${index}`} />
      ))}
      {incomingResponses.map((response, index) => (
        <g
          className={styles.incomingResponse}
          data-tone={response.tone}
          key={`incoming-response-${index}`}
        >
          <ResponseMarker tone={response.tone} />
          <animateMotion
            begin={`${response.delay}s`}
            dur="6.6s"
            path={incomingLanes[response.lane].path}
            repeatCount="indefinite"
          />
        </g>
      ))}
      {validatedResponses.map((response, index) => (
        <circle className={styles.validatedResponse} key={`validated-response-${index}`} r="4.5">
          <animateMotion
            begin={`${response.delay}s`}
            dur="6.6s"
            path={outgoingLanes[response.lane].path}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </svg>
  );
}

function Slot({ values }: { values: string[] }) {
  return (
    <span className={styles.slotViewport}>
      <span className={styles.slotTrack}>
        {values.map((value) => (
          <b key={value}>{value}</b>
        ))}
      </span>
    </span>
  );
}

function GatewayMetric({
  label,
  value,
  values,
  tone,
}: {
  label: string;
  value?: string;
  values?: string[];
  tone: "neutral" | "error" | "valid";
}) {
  return (
    <div className={styles.gatewayMetric} data-tone={tone}>
      <i />
      <span>{label}</span>
      {values ? <Slot values={values} /> : <b>{value}</b>}
    </div>
  );
}

function ResponseMarker({ tone }: { tone: ResponseTone }) {
  if (tone === "root") {
    return (
      <path d="M 0 -6 Q .8 -6 1.25 -5.2 L 6 3.8 Q 6.5 5 5.1 5 H -5.1 Q -6.5 5 -6 3.8 L -1.25 -5.2 Q -.8 -6 0 -6 Z" />
    );
  }
  if (tone === "reference") return <rect x="-5" y="-5" width="10" height="10" rx="2" />;
  if (tone === "type") return <circle r="5" />;
  return <circle r="5" />;
}
