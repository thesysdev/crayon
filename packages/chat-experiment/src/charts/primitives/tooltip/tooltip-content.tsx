"use client";

import type { ReactNode } from "react";
import { intFmt } from "../../core/chart-formatters";

export interface TooltipRow {
  color: string;
  label: string;
  value: string | number;
}

export interface TooltipContentProps {
  title?: string;
  rows: TooltipRow[];
  /** Optional additional content (e.g., markers) */
  children?: ReactNode;
}

export function TooltipContent({ title, rows, children }: TooltipContentProps) {
  return (
    <div className="ce-tooltip-content">
      <div className="ce-tooltip-content-inner">
        {title && <div className="ce-tooltip-content-title">{title}</div>}
        <div className="ce-tooltip-content-rows">
          {rows.map((row) => (
            <div className="ce-tooltip-row" key={`${row.label}-${row.color}`}>
              <div className="ce-tooltip-row-label-group">
                <span className="ce-tooltip-row-swatch" style={{ backgroundColor: row.color }} />
                <span className="ce-tooltip-row-label">{row.label}</span>
              </div>
              <span className="ce-tooltip-row-value">
                {typeof row.value === "number" ? intFmt(row.value) : row.value}
              </span>
            </div>
          ))}
        </div>

        {children && <div className="ce-tooltip-content-extra">{children}</div>}
      </div>
    </div>
  );
}

TooltipContent.displayName = "TooltipContent";

export default TooltipContent;
