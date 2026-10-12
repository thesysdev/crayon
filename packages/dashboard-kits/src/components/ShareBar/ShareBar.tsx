import { SegmentedBar } from "@openuidev/react-ui";
import { formatPercent } from "../../core/format";
import type { Item, ValueFormat } from "../../core/schemas";
import { ALL } from "../BarList";
import { SERIES_COLORS } from "../Charts/utils/constants";
import { formatValue } from "../Charts/utils/format";

export interface ShareBarProps {
  /** Up to six parts of a whole, in display order. */
  items: Item[];
  format?: ValueFormat;
  /** The current filter value, when parts filter the dashboard. */
  selected?: string;
  /**
   * Make parts with a filter key selectable: called with the part's key, or
   * with "all" to show every part again.
   */
  onSelect?: (key: string) => void;
}

/** A faded version of a slot color, for the parts a selection is not showing. */
const fade = (color: string) => `color-mix(in srgb, ${color} 30%, var(--kit-card))`;

/**
 * Part-to-whole: the total, one segmented bar drawn by react-ui's
 * `SegmentedBar` (its hover highlight and tooltip included), and a legend of
 * each part's value and share. Parts can drive a dashboard filter; the chosen
 * part keeps its color while the others fade, and "Show all" clears it.
 */
export function ShareBar({ items: allItems, format, selected, onSelect }: ShareBarProps) {
  const items = allItems.slice(0, 6);
  const total = items.reduce((a, i) => a + i.value, 0) || 1;
  const active = onSelect != null && selected != null && selected !== ALL && selected !== "";
  const picked = active ? items.find((i) => i.key === selected) : undefined;
  const colors = items.map((item, k) => {
    const color = SERIES_COLORS[k % SERIES_COLORS.length]!;
    return picked && item !== picked ? fade(color) : color;
  });
  return (
    <div className="kit-share">
      <div className="kit-share__total">
        <span className="kit-share__total-value">
          {formatValue(picked?.value ?? total, format)}
        </span>
        <span className="kit-muted">{picked ? picked.name : "total"}</span>
        {picked && onSelect && (
          <button type="button" className="kit-share__clear" onClick={() => onSelect(ALL)}>
            Show all
          </button>
        )}
      </div>
      <SegmentedBar
        data={items.map((item) => ({ name: item.name, value: item.value }))}
        categoryKey="name"
        dataKey="value"
        customPalette={colors}
        legend={false}
        isAnimationActive
        className="kit-share__bar"
      />
      <ul className="kit-share__legend">
        {items.map((item, k) => {
          const row = (
            <>
              <i className="kit-key kit-key--rect" style={{ color: colors[k] }} aria-hidden />
              <span className="kit-share__name">{item.name}</span>
              <span className="kit-share__value">{formatValue(item.value, format)}</span>
              <span className="kit-share__pct">{formatPercent(item.value / total, 0)}</span>
            </>
          );
          const faded = picked && item !== picked ? "" : undefined;
          return onSelect && item.key ? (
            <li key={item.name} data-faded={faded}>
              <button
                type="button"
                className="kit-share__row kit-share__button"
                aria-pressed={item === picked}
                title={`Filter the dashboard to ${item.name}`}
                onClick={() => onSelect(item === picked ? ALL : item.key!)}
              >
                {row}
              </button>
            </li>
          ) : (
            <li key={item.name} className="kit-share__row" data-faded={faded}>
              {row}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
