"use client";

import { createParser, type ElementNode } from "@openuidev/lang-core";
import {
  Check,
  ChevronRight,
  Clock3,
  CreditCard,
  Flame,
  Home,
  MessageCircle,
  Pause,
  Pizza,
  Play,
  RotateCcw,
  UserRound,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import styles from "./AppLessDemo.module.css";
import mapStyles from "./DeliveryMap.module.css";
import { scenes } from "./demo-programs";

const mobileRequests = {
  dinner: "Order dinner nearby",
  truffle: "Customize my pizza",
  cart: "Add the pizza to my cart",
  checkout: "Checkout with saved details",
};

// The presentation's component signatures, in their original positional order.
const signatures: Record<string, string[]> = {
  Card: ["children"],
  CardHeader: ["title", "subtitle"],
  TextContent: ["text", "style"],
  ListBlock: ["items", "header"],
  ListItem: ["title", "subtitle", "leading", "trailing", "action"],
  Toggle: ["title", "on", "icon", "subtitle"],
  KVList: ["rows", "header"],
  ImageBlock: ["src", "caption"],
  FoodCategory: ["title", "image"],
  ProductDetails: ["title", "description", "price", "rating", "eta"],
  ProductItem: ["title", "subtitle", "image", "price"],
  DeliveryMap: ["address", "eta"],
  Chips: ["labels"],
  Button: ["label", "action", "variant"],
  Buttons: ["children", "direction"],
};
const parser = createParser({
  $defs: Object.fromEntries(
    Object.entries(signatures).map(([name, props]) => [
      name,
      { properties: Object.fromEntries(props.map((p) => [p, {}])) },
    ]),
  ),
});
const nodes = (v: unknown): ElementNode[] =>
  Array.isArray(v) ? v.filter((n): n is ElementNode => !!n && n.type === "element") : [];
const str = (v: unknown) => (typeof v === "string" || typeof v === "number" ? String(v) : "");
const icons: Record<string, LucideIcon> = {
  pizza: Pizza,
  utensils: Utensils,
  flame: Flame,
  home: Home,
  clock: Clock3,
  "message-circle": MessageCircle,
  "credit-card": CreditCard,
  wallet: Wallet,
};
function LeadingIcon({ name }: { name: string }) {
  const Icon = icons[name];
  return Icon ? <Icon size={16} strokeWidth={1.8} /> : null;
}

function DemoNode({
  node,
  advance,
  scene,
}: {
  node: ElementNode;
  advance: (next: number) => void;
  scene: number;
}): ReactNode {
  const p = node.props;
  const children = (v: unknown) =>
    nodes(v).map((child, index) => (
      <DemoNode key={child.statementId ?? index} node={child} advance={advance} scene={scene} />
    ));
  const heading = p.header ? <h4 className={styles.sectionLabel}>{str(p.header)}</h4> : null;
  switch (node.typeName) {
    case "CardHeader":
      return (
        <header className={styles.screenHeader}>
          {p.subtitle ? <small>{str(p.subtitle)}</small> : null}
          <h3>{str(p.title)}</h3>
        </header>
      );
    case "TextContent":
      return <h4 className={styles.sectionLabel}>{str(p.text)}</h4>;
    case "ListBlock":
      return (
        <>
          {heading}
          <div className={`${styles.list} ${p.header === "CATEGORIES" ? styles.categories : ""}`}>
            {children(p.items)}
          </div>
        </>
      );
    case "ListItem": {
      const body = (
        <>
          <span
            className={str(p.leading).startsWith("/") ? styles.restaurantPhoto : styles.leading}
            aria-hidden="true"
          >
            {str(p.leading).startsWith("/") ? (
              <Image src={str(p.leading)} alt="" width={80} height={80} />
            ) : (
              <LeadingIcon name={str(p.leading)} />
            )}
          </span>
          <span className={styles.rowCopy}>
            <b>{str(p.title)}</b>
            {p.subtitle ? <small>{str(p.subtitle)}</small> : null}
          </span>
          {p.trailing ? (
            <span className={styles.trailing}>
              {p.trailing === "Selected" ? (
                <Check size={15} aria-label="Selected" className={styles.selectedCheck} />
              ) : (
                str(p.trailing)
              )}
            </span>
          ) : null}
        </>
      );
      return node.statementId === "luigi" ? (
        <button className={styles.row} onClick={() => advance(1)}>
          {body}
          <ChevronRight size={15} aria-hidden="true" />
        </button>
      ) : (
        <div className={styles.row}>{body}</div>
      );
    }
    case "FoodCategory":
      return (
        <div className={styles.categoryPhoto}>
          <Image src={str(p.image)} alt={str(p.title)} width={160} height={140} />
          <b>{str(p.title)}</b>
        </div>
      );
    case "ProductDetails":
      return (
        <div className={styles.productDetails}>
          <div className={styles.productTitle}>
            <h3>{str(p.title)}</h3>
            <strong>{str(p.price)}</strong>
          </div>
          <p>{str(p.description)}</p>
          <div className={styles.productMeta}>
            <span>★ {str(p.rating)}</span>
            <span>
              <Clock3 size={12} /> {str(p.eta)}
            </span>
          </div>
        </div>
      );
    case "ProductItem":
      return (
        <div className={styles.productItem}>
          <Image src={str(p.image)} alt={str(p.title)} width={240} height={180} />
          <div>
            <b>{str(p.title)}</b>
            <small>{str(p.subtitle)}</small>
            <span className={styles.cartPrice}>
              <strong>{str(p.price)}</strong>
              <small>Qty 1</small>
            </span>
          </div>
        </div>
      );
    case "DeliveryMap":
      return (
        <div className={styles.deliveryMap}>
          <svg
            className={mapStyles.map}
            viewBox="0 0 300 150"
            role="img"
            aria-label={`Illustrative delivery map to ${str(p.address)}`}
          >
            <rect width="300" height="150" fill="var(--map-land)" />
            <path d="M0 0H46L15 150H0Z" fill="var(--map-water)" />
            <path d="M200 4h78v35h-78zM57 96h43v44H57z" fill="var(--map-park)" />
            <g stroke="var(--map-road)" strokeWidth="9">
              <path d="M60-10 35 160M112-10 87 160M170-10 145 160M227-10 202 160M283-10 258 160M25 45 310 89M20 95 300 139M35-8 300 33" />
            </g>
            <path
              d="m95 115 8-55 111 17 6-40"
              fill="none"
              stroke="var(--map-route-halo)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="m95 115 8-55 111 17 6-40"
              fill="none"
              stroke="var(--map-route)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="95"
              cy="115"
              r="6"
              fill="var(--map-route)"
              stroke="var(--map-road)"
              strokeWidth="3"
            />
            <circle cx="220" cy="37" r="13" fill="var(--map-pin)" />
            <path d="m214 38 6-6 6 6v6h-4v-5h-4v5h-4z" fill="var(--map-pin-ink)" />
            <text
              x="130"
              y="119"
              fontSize="8"
              fill="var(--map-label)"
              transform="rotate(9 130 119)"
            >
              WEST 14TH ST
            </text>
          </svg>
          <div>
            <span>
              <b>Arriving in {str(p.eta)}</b>
              <small>{str(p.address)}</small>
            </span>
            <span className={styles.deliveryDot} />
          </div>
        </div>
      );
    case "Toggle":
      return (
        <label className={styles.row}>
          <span className={styles.rowCopy}>
            <b>{str(p.title)}</b>
            <small>{str(p.subtitle)}</small>
          </span>
          <input type="checkbox" defaultChecked={!!p.on} />
        </label>
      );
    case "KVList":
      return (
        <>
          {heading}
          <dl className={`${styles.kv} ${p.header === "ORDER SUMMARY" ? styles.orderSummary : ""}`}>
            {(Array.isArray(p.rows) ? p.rows : []).map(
              (row: { label?: string; value?: string }, i) => (
                <div key={i}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ),
            )}
          </dl>
        </>
      );
    case "ImageBlock":
      return (
        <figure className={styles.photo}>
          <Image src={str(p.src)} alt={str(p.caption)} width={520} height={280} />
        </figure>
      );
    case "Chips":
      return (
        <div className={styles.chips}>
          {(Array.isArray(p.labels) ? p.labels : []).map((label, i) => (
            <span key={i}>{str(label)}</span>
          ))}
        </div>
      );
    case "Button": {
      const next = node.statementId === "more" ? 1 : (scene + 1) % scenes.length;
      return (
        <button
          className={`${styles.screenButton} ${p.variant === "secondary" ? styles.secondary : ""}`}
          onClick={() => advance(next)}
        >
          {str(p.label)}
        </button>
      );
    }
    case "Buttons":
      return <div className={styles.screenActions}>{children(p.children)}</div>;
    default:
      return null;
  }
}

// What each top-level block is called in the timeline. A list or key-value
// block is named after its own header when it has one.
const blockNames: Record<string, string> = {
  CardHeader: "Header",
  TextContent: "Section title",
  ListBlock: "List",
  KVList: "Summary",
  ImageBlock: "Photo",
  ProductDetails: "Product details",
  ProductItem: "Cart item",
  DeliveryMap: "Delivery map",
  Chips: "Filter chips",
  Button: "Button",
  Buttons: "Actions",
};
function blockName(node: ElementNode) {
  const header = str(node.props.header).toLowerCase();
  if (header) return header.charAt(0).toUpperCase() + header.slice(1);
  return blockNames[node.typeName] ?? node.typeName;
}
// Seconds of replay per source line: four 40ms ticks.
const SECONDS_PER_LINE = 0.16;

function CodeLine({ value }: { value: string }) {
  return (
    <>
      {(
        value.match(/"(?:\\.|[^"\\])*"|@[\w]+|\b[A-Z]\w*\b|\b\d+(?:\.\d+)?\b|[^"@A-Z0-9]+|./g) ?? []
      ).map((token, i) => (
        <span
          key={i}
          className={
            token.startsWith('"')
              ? styles.string
              : /^[A-Z]/.test(token)
                ? styles.component
                : token.startsWith("@")
                  ? styles.annotation
                  : undefined
          }
        >
          {token}
        </span>
      ))}
    </>
  );
}

export function AppLessDemo() {
  const [frame, setFrame] = useState({ scene: 0, tick: 0 });
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [compact, setCompact] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const code = useRef<HTMLPreElement>(null);
  const phone = useRef<HTMLDivElement>(null);
  const visible = useRef(false);
  const scene = scenes[frame.scene];
  const lines = useMemo(() => scene.source.split("\n"), [scene]);
  const count = reduced ? lines.length : Math.min(Math.floor(frame.tick / 4), lines.length);
  const complete = count === lines.length;
  const elapsed = (Math.min(frame.tick, lines.length * 4) * 0.04).toFixed(2);
  const parse = (source: string) => parser.parse(source.replace(/^@AppIcon.*\n?/gm, ""));
  const settled = useMemo(() => nodes(parse(scene.source).root?.props.children), [scene]);
  const current = useMemo(
    () => nodes(parse(lines.slice(0, count).join("\n")).root?.props.children),
    [lines, count],
  );

  // The replay as a list of plain-language events. Each is done once the line
  // that causes it has been written, so the list moves in step with the phone.
  const events = useMemo(() => {
    const lineOf = (id: string) => lines.findIndex((line) => line.startsWith(`${id} = `)) + 1;
    const rootLine = lineOf("root");
    return [
      { key: "asked", label: "User asked a query", detail: scene.request, atLine: 0 },
      { key: "writing", label: "OUI-1 started writing OpenUI Lang", atLine: 1 },
      ...settled.map((node, index) => ({
        key: node.statementId ?? String(index),
        label: `${blockName(node)} rendered`,
        atLine: Math.max(rootLine, lineOf(node.statementId ?? "")),
      })),
      { key: "ready", label: "Interface ready", atLine: lines.length },
    ];
  }, [lines, scene, settled]);
  const timer = (
    <div
      className={`${styles.timer} ${complete ? styles.timerDone : ""}`}
      title="Elapsed time of the scripted browser replay, not model inference latency"
    >
      {reduced ? (
        <small>Static preview</small>
      ) : (
        <strong>
          <time>
            {elapsed}
            <span>s</span>
          </time>
        </strong>
      )}
    </div>
  );

  useEffect(() => {
    const mobile = matchMedia("(max-width: 1100px)");
    const readMobile = () => setCompact(mobile.matches);
    readMobile();
    mobile.addEventListener("change", readMobile);
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setReduced(query.matches);
    read();
    query.addEventListener("change", read);
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible.current = entry.isIntersecting;
      },
      { threshold: 0.15 },
    );
    if (host.current) observer.observe(host.current);
    return () => {
      query.removeEventListener("change", read);
      mobile.removeEventListener("change", readMobile);
      observer.disconnect();
    };
  }, []);
  useEffect(() => {
    if (paused || reduced) return;
    const timer = setInterval(() => {
      if (!visible.current || document.hidden) return;
      setFrame((previous) =>
        previous.tick >= scenes[previous.scene].source.split("\n").length * 4 + 100
          ? { scene: (previous.scene + 1) % scenes.length, tick: 0 }
          : { ...previous, tick: previous.tick + 1 },
      );
    }, 40);
    return () => clearInterval(timer);
  }, [paused, reduced]);
  useEffect(() => {
    if (code.current) code.current.scrollTop = code.current.scrollHeight;
    if (phone.current && count === 0) phone.current.scrollTop = 0;
  }, [count]);
  useEffect(() => {
    if (!complete || paused || reduced) return;
    const timer = setTimeout(() => {
      if (visible.current && phone.current) {
        phone.current.scrollTo({ top: phone.current.scrollHeight, behavior: "smooth" });
      }
    }, 1400);
    return () => clearTimeout(timer);
  }, [complete, paused, reduced, frame.scene]);
  const advance = (next: number) => {
    setPaused(true);
    setFrame({ scene: next, tick: scenes[next].source.split("\n").length * 4 });
  };

  return (
    <div
      className={styles.demo}
      ref={host}
      data-demo-scene={scene.key}
      data-demo-complete={complete}
    >
      <div className={styles.mobileRequest}>
        <div className={styles.mobileRequestText}>
          <span className={styles.mobileQueryAvatar} aria-hidden="true">
            <UserRound size={14} strokeWidth={2} />
          </span>
          <span>{mobileRequests[scene.key]}</span>
        </div>
        <div className={styles.mobileTiming}>
          <span className={styles.mobileRequestLabel}>Time to render</span>
          {timer}
        </div>
      </div>
      <div className={styles.codePanel} inert={compact}>
        {/* The same source and replay power all three panels. */}
        <div className={styles.panelHeader}>
          <span className={styles.codeLabel}>OpenUI Lang</span>
          <span className={styles.panelMeta}>Source</span>
          <span className={styles.compactTimer}>{timer}</span>
        </div>
        <pre
          className={styles.code}
          ref={code}
          aria-label="OpenUI Lang source for the phone interface"
        >
          <code>
            {lines.slice(0, count).map((line, i) => (
              <span className={styles.codeLine} key={i}>
                <span className={styles.lineNumber} aria-hidden="true">
                  {i + 1}
                </span>
                <span>
                  <CodeLine value={line} />
                </span>
              </span>
            ))}
          </code>
        </pre>
      </div>
      <div className={styles.previewPanel}>
        <div className={styles.panelHeader}>
          <span className={styles.previewLabel}>Live preview</span>
          <div className={styles.controls}>
            <div>
              {!reduced && (
                <button
                  aria-label={paused ? "Play demo animation" : "Pause demo animation"}
                  onClick={() => setPaused(!paused)}
                >
                  {paused ? <Play size={15} /> : <Pause size={15} />}
                </button>
              )}
              <button
                aria-label="Restart demo"
                onClick={() => {
                  setFrame({ scene: 0, tick: 0 });
                  setPaused(false);
                }}
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>
        </div>
        <div className={styles.phoneSide}>
          <div className={styles.phone}>
            {/* Status-bar proportions follow the original presentation phone shell. */}
            <div className={styles.statusBar} aria-hidden="true">
              <span>9:41</span>
              <svg width="58" height="12" viewBox="0 0 58 12" fill="currentColor">
                <path d="M0 8h3v4H0zm5-3h3v7H5zm5-3h3v10h-3zm5-2h3v12h-3z" />
                <path d="M23 4a10 10 0 0 1 14 0l-1.5 1.5a8 8 0 0 0-11 0zm3 3a6 6 0 0 1 8 0l-1.5 1.5a4 4 0 0 0-5 0zm2.5 3 1.5-1 1.5 1L30 12z" />
                <rect x="41" y="2" width="14" height="8" rx="2" fill="none" stroke="currentColor" />
                <rect x="43" y="4" width="10" height="4" rx=".5" />
                <path d="M57 4h1v4h-1z" />
              </svg>
            </div>
            <div
              className={styles.screen}
              ref={phone}
              inert={compact}
              onPointerDown={() => setPaused(true)}
              onFocusCapture={() => setPaused(true)}
              aria-label="Rendered phone interface"
              key={scene.key}
            >
              {settled.map((node, index) => {
                const resolved = current.find((n) => n.statementId === node.statementId);
                return (
                  <div
                    key={node.statementId ?? index}
                    className={styles.block}
                    style={{ visibility: resolved ? "visible" : "hidden" }}
                  >
                    <DemoNode node={resolved ?? node} advance={advance} scene={frame.scene} />
                  </div>
                );
              })}
            </div>
            <span className={styles.homeIndicator} aria-hidden="true" />
          </div>
        </div>
      </div>
      {/* Wide screens only: the replay told as events, right of the phone. */}
      <div className={styles.timeline}>
        <div className={styles.panelHeader}>
          <span>Render trace</span>
          <span className={styles.panelMeta}>OUI-1</span>
        </div>
        <div className={styles.traceSummary}>
          <span className={styles.timerLabel}>Time to render</span>
          {timer}
          <div className={styles.progressTrack} aria-hidden="true">
            <span
              style={{
                width: `${(count / lines.length) * 100}%`,
                transition: count === 0 ? "none" : undefined,
              }}
            />
          </div>
        </div>
        <ol className={styles.events} aria-label="Replay timeline">
          {events.map((event) => (
            <li key={event.key} className={styles.event} data-done={count >= event.atLine}>
              {/* always present, so the rail keeps its place in a static preview */}
              <span className={styles.eventTime}>
                {reduced ? "" : `${(event.atLine * SECONDS_PER_LINE).toFixed(2)}s`}
              </span>
              <i className={styles.eventDot} aria-hidden="true" />
              <span className={styles.eventCopy}>
                {event.label}
                {"detail" in event && event.detail ? <small>{event.detail}</small> : null}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
