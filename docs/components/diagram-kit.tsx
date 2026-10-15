import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// Shared drawing pieces for the OpenUI Lang docs diagrams. They follow the style of
// openui-flow-diagram.tsx: outlined boxes, lucide icons, uppercase mono arrow labels, and theme
// tokens so the same SVG works in light and dark mode.

export const labelClass =
  "fill-fd-foreground font-mono text-[13px] font-bold uppercase tracking-[0.1em]";

// For labels that are code, such as a function name, where uppercase would change the meaning.
const codeLabelClass = "fill-fd-foreground font-mono text-[13px] font-bold";

const boxClass = "fill-fd-background stroke-fd-foreground";
const highlightClass = "fill-[#eef1fb] stroke-fd-foreground dark:fill-[#1c2233]";

export function DiagramFrame({
  id,
  title,
  description,
  width,
  height,
  minWidth,
  children,
}: {
  id: string;
  title: string;
  description: string;
  width: number;
  height: number;
  /** Below this width the figure scrolls inside its container instead of shrinking further. */
  minWidth: number;
  children: ReactNode;
}) {
  return (
    <figure className="not-prose my-8 overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby={`${id}-title ${id}-description`}
        className="h-auto w-full text-fd-foreground"
        style={{ minWidth }}
      >
        <title id={`${id}-title`}>{title}</title>
        <desc id={`${id}-description`}>{description}</desc>
        <defs>
          <marker
            id={`${id}-arrow`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="11"
            markerHeight="11"
            markerUnits="userSpaceOnUse"
            orient="auto-start-reverse"
          >
            <path
              d="M1 1 L9 5 L1 9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </marker>
        </defs>
        {children}
      </svg>
    </figure>
  );
}

export function Label({
  x,
  y,
  anchor = "middle",
  code,
  children,
}: {
  x: number;
  y: number;
  anchor?: "start" | "middle" | "end";
  code?: boolean;
  children: ReactNode;
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} className={code ? codeLabelClass : labelClass}>
      {children}
    </text>
  );
}

export function Arrow({
  marker,
  x1,
  y1,
  x2,
  y2,
  dashed,
}: {
  marker: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  dashed?: boolean;
}) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="currentColor"
      strokeWidth={1.6}
      strokeDasharray={dashed ? "5 5" : undefined}
      markerEnd={`url(#${marker}-arrow)`}
    />
  );
}

export function PathArrow({ marker, d, dashed }: { marker: string; d: string; dashed?: boolean }) {
  return (
    <path
      d={d}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeDasharray={dashed ? "5 5" : undefined}
      markerEnd={`url(#${marker}-arrow)`}
    />
  );
}

export type NodeProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  icon: LucideIcon;
  title: string;
  lines?: string[];
  footer?: string;
  highlight?: boolean;
  /** Keep the title's case, for code such as `$days` or `parseMessage`. */
  codeTitle?: boolean;
};

/** A box with a centered icon, an uppercase title, and short lines of text. */
export function Node({
  x,
  y,
  width,
  height,
  icon: Icon,
  title,
  lines = [],
  footer,
  highlight,
  codeTitle,
}: NodeProps) {
  const center = x + width / 2;
  const contentHeight = 30 + 30 + lines.length * 22;
  const top = y + Math.max(14, (height - contentHeight - (footer ? 22 : 0)) / 2);
  const titleY = top + 52;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={12}
        strokeWidth={1.75}
        className={highlight ? highlightClass : boxClass}
      />
      <Icon
        x={center - 14}
        y={top}
        width={28}
        height={28}
        strokeWidth={1.6}
        className="text-fd-foreground"
        aria-hidden="true"
      />
      <text
        x={center}
        y={titleY}
        textAnchor="middle"
        className={
          codeTitle
            ? "fill-fd-foreground font-mono text-[16px] font-bold"
            : "fill-fd-foreground font-mono text-[15px] font-bold uppercase tracking-[0.05em]"
        }
      >
        {title}
      </text>
      {lines.map((line, index) => (
        <text
          key={line}
          x={center}
          y={titleY + 26 + index * 22}
          textAnchor="middle"
          className="fill-fd-muted-foreground font-sans text-[15px]"
        >
          {line}
        </text>
      ))}
      {footer && (
        <text
          x={center}
          y={y + height - 14}
          textAnchor="middle"
          className="fill-fd-muted-foreground font-mono text-[11.5px] font-semibold uppercase tracking-[0.12em]"
        >
          {footer}
        </text>
      )}
    </g>
  );
}

export type CodeLine = { text: string; tag?: string };

/** A box with an icon and title on top and lines of code below. */
export function CodeNode({
  x,
  y,
  width,
  height,
  icon: Icon,
  title,
  code,
  highlight,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  icon: LucideIcon;
  title: string;
  code: (string | CodeLine)[];
  highlight?: boolean;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={12}
        strokeWidth={1.75}
        className={highlight ? highlightClass : boxClass}
      />
      <Icon
        x={x + 16}
        y={y + 14}
        width={22}
        height={22}
        strokeWidth={1.6}
        className="text-fd-foreground"
        aria-hidden="true"
      />
      <text
        x={x + 48}
        y={y + 31}
        className="fill-fd-foreground font-mono text-[14px] font-bold uppercase tracking-[0.05em]"
      >
        {title}
      </text>
      <line
        x1={x}
        y1={y + 48}
        x2={x + width}
        y2={y + 48}
        strokeWidth={1}
        className="stroke-fd-muted-foreground/40"
      />
      {code.map((entry, index) => {
        const line = typeof entry === "string" ? { text: entry } : entry;
        const lineY = y + 74 + index * 24;
        return (
          <g key={`${index}-${line.text}`}>
            <text
              x={x + 16}
              y={lineY}
              xmlSpace="preserve"
              className="fill-fd-foreground font-mono text-[13.5px]"
            >
              {line.text}
            </text>
            {line.tag && (
              <text
                x={x + width - 16}
                y={lineY}
                textAnchor="end"
                className="fill-fd-muted-foreground font-mono text-[11.5px] font-bold uppercase tracking-[0.12em]"
              >
                {line.tag}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

export function Lane({
  x,
  y,
  width,
  height,
  title,
  tag,
  tagWidth = 150,
  tagRight,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  tag?: string;
  tagWidth?: number;
  /** Put the tag at the right end of the lane instead of after the title. */
  tagRight?: boolean;
}) {
  const titleWidth = title.length * 9.6;
  const tagX = tagRight ? x + width - 20 - tagWidth : x + 32 + titleWidth;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={16}
        strokeWidth={1.25}
        strokeDasharray="6 6"
        className="fill-fd-muted/40 stroke-fd-muted-foreground/60"
      />
      <text x={x + 20} y={y + 32} className={labelClass}>
        {title}
      </text>
      {tag && (
        <g>
          <rect
            x={tagX}
            y={y + 14}
            width={tagWidth}
            height={26}
            rx={13}
            className="fill-fd-foreground"
          />
          <text
            x={tagX + tagWidth / 2}
            y={y + 32}
            textAnchor="middle"
            className="fill-fd-background font-mono text-[11.5px] font-bold uppercase tracking-[0.12em]"
          >
            {tag}
          </text>
        </g>
      )}
    </g>
  );
}

/** A short box with the icon on the left, a title, and one line of text. */
export function RowNode({
  x,
  y,
  width,
  height,
  icon: Icon,
  title,
  line,
  highlight,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  icon: LucideIcon;
  title: string;
  line: string;
  highlight?: boolean;
}) {
  const middle = y + height / 2;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={12}
        strokeWidth={1.75}
        className={highlight ? highlightClass : boxClass}
      />
      <Icon
        x={x + 18}
        y={middle - 12}
        width={24}
        height={24}
        strokeWidth={1.6}
        className="text-fd-foreground"
        aria-hidden="true"
      />
      <text
        x={x + 58}
        y={middle - 4}
        className="fill-fd-foreground font-mono text-[14px] font-bold uppercase tracking-[0.05em]"
      >
        {title}
      </text>
      <text x={x + 58} y={middle + 17} className="fill-fd-muted-foreground font-sans text-[14px]">
        {line}
      </text>
    </g>
  );
}
