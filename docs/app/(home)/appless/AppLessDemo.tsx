"use client";

import { createParser, type ElementNode } from "@openuidev/lang-core";
import { BatteryFull, Check, Code2, Pause, Play, RotateCcw, Smartphone, Wifi } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import styles from "./AppLessDemo.module.css";
import { scenes } from "./demo-programs";

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
const emoji: Record<string, string> = {
  pizza: "🍕",
  utensils: "🍽️",
  flame: "🔥",
  home: "🏠",
  clock: "🕒",
  "message-circle": "💬",
  "credit-card": "💳",
  wallet: "👛",
};

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
          <div className={styles.list}>{children(p.items)}</div>
        </>
      );
    case "ListItem": {
      const body = (
        <>
          <span className={styles.emoji} aria-hidden="true">
            {emoji[str(p.leading)] ?? ""}
          </span>
          <span className={styles.rowCopy}>
            <b>{str(p.title)}</b>
            {p.subtitle ? <small>{str(p.subtitle)}</small> : null}
          </span>
          {p.trailing ? <span className={styles.trailing}>{str(p.trailing)}</span> : null}
        </>
      );
      return node.statementId === "luigi" ? (
        <button className={styles.row} onClick={() => advance(1)}>
          {body}
          <span aria-hidden="true">›</span>
        </button>
      ) : (
        <div className={styles.row}>{body}</div>
      );
    }
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
          <dl className={styles.kv}>
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
          <figcaption>{str(p.caption)}</figcaption>
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
  const host = useRef<HTMLDivElement>(null);
  const code = useRef<HTMLPreElement>(null);
  const phone = useRef<HTMLDivElement>(null);
  const visible = useRef(false);
  const scene = scenes[frame.scene];
  const lines = useMemo(() => scene.source.split("\n"), [scene]);
  const count = reduced ? lines.length : Math.min(frame.tick, lines.length);
  const complete = count === lines.length;
  const parse = (source: string) => parser.parse(source.replace(/^@AppIcon.*\n?/gm, ""));
  const settled = useMemo(() => nodes(parse(scene.source).root?.props.children), [scene]);
  const current = useMemo(
    () => nodes(parse(lines.slice(0, count).join("\n")).root?.props.children),
    [lines, count],
  );

  useEffect(() => {
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
      observer.disconnect();
    };
  }, []);
  useEffect(() => {
    if (paused || reduced) return;
    const timer = setInterval(() => {
      if (!visible.current || document.hidden) return;
      setFrame((previous) =>
        previous.tick >= scenes[previous.scene].source.split("\n").length + 14
          ? { scene: (previous.scene + 1) % scenes.length, tick: 0 }
          : { ...previous, tick: previous.tick + 1 },
      );
    }, 280);
    return () => clearInterval(timer);
  }, [paused, reduced]);
  useEffect(() => {
    if (code.current) code.current.scrollTop = code.current.scrollHeight;
    if (phone.current && count === 0) phone.current.scrollTop = 0;
  }, [count]);
  const advance = (next: number) => {
    setPaused(true);
    setFrame({ scene: next, tick: scenes[next].source.split("\n").length });
  };

  return (
    <div
      className={styles.demo}
      ref={host}
      data-demo-scene={scene.key}
      data-demo-complete={complete}
    >
      <div className={styles.codePanel}>
        <div className={styles.panelHeader}>
          <span>
            <Code2 size={16} /> OpenUI Lang
          </span>
          <span className={styles.replayLabel}>Demo replay</span>
        </div>
        <p className={styles.request}>{scene.request}</p>
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
        <div className={styles.codeStatus}>
          <span>
            {complete ? <Check size={14} /> : <span className={styles.dot} />}{" "}
            {complete ? "Ready to explore" : "Rendering components"}
          </span>
          <span>
            {count}/{lines.length}
          </span>
        </div>
      </div>
      <div className={styles.phoneSide}>
        <div className={styles.phone}>
          <div className={styles.statusBar} aria-hidden="true">
            <span>9:41</span>
            <span className={styles.island} />
            <span>
              <Wifi size={12} />
              <BatteryFull size={15} />
            </span>
          </div>
          <div className={styles.phoneNav}>
            <Smartphone size={12} />
            <span>AppLess</span>
            <span>
              {frame.scene + 1} / {scenes.length}
            </span>
          </div>
          <div
            className={styles.screen}
            ref={phone}
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
      <div className={styles.controls}>
        <span>Code becomes a native interface</span>
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
  );
}
