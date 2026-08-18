import type { ReactNode } from "react";
import { BRAND_MARKS } from "./brand-marks";
import { MASCOT_PATHS, MASCOT_VIEWBOX } from "./openui-mascot";
import s from "./viz.module.css";

export const SLOT = [s.s1, s.s2, s.s3] as const;
export const slotClass = (slot: 1 | 2 | 3) => SLOT[slot - 1];

export function Mark({ id }: { id?: string }) {
  if (id === "openui") {
    return (
      <svg viewBox={MASCOT_VIEWBOX} aria-hidden>
        {MASCOT_PATHS.map((d, i) => (
          <path key={i} d={d} fill="currentColor" />
        ))}
      </svg>
    );
  }
  const d = id ? BRAND_MARKS[id] : undefined;
  if (!d) return null;
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d={d} fill="currentColor" />
    </svg>
  );
}

/** The 20px square logo chip from the reviewed design. */
export function Chip({ mark }: { mark?: string }) {
  if (!mark) return null;
  return (
    <span className={s.chip} aria-hidden>
      <Mark id={mark} />
    </span>
  );
}

export function Chart({
  title,
  sub,
  legend,
  note,
  tight,
  children,
}: {
  title: string;
  sub?: string;
  legend?: Array<{ label: string; slot: 1 | 2 | 3 }>;
  note?: ReactNode;
  tight?: boolean;
  children: ReactNode;
}) {
  return (
    <figure className={`${s.viz} ${tight ? s.tight : ""}`}>
      <figcaption className={s.head}>
        <p className={s.title}>{title}</p>
        {sub ? <p className={s.sub}>{sub}</p> : null}
      </figcaption>
      {children}
      {legend ? (
        <div className={s.legend}>
          {legend.map((k) => (
            <span key={k.label} className={`${s.key} ${slotClass(k.slot)}`}>
              <span className={s.dot} aria-hidden />
              {k.label}
            </span>
          ))}
        </div>
      ) : null}
      {note ? <p className={s.note}>{note}</p> : null}
    </figure>
  );
}

/** One 32px row: logo chip + name on the left, bar and value in the body. */
export function Row({
  label,
  mark,
  children,
}: {
  label: string;
  mark?: string;
  children: ReactNode;
}) {
  return (
    <div className={s.row}>
      <span className={s.rowName}>
        <Chip mark={mark} />
        <span className={s.rowLabel}>{label}</span>
      </span>
      <span className={s.rowBody}>{children}</span>
    </div>
  );
}

export { s as styles };
