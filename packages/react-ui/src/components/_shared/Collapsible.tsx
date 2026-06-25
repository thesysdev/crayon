import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

/**
 * Content-agnostic, aria-correct collapsible — the extracted version of the old
 * `ToolCodeBlock` (chevron + `aria-expanded`/`aria-controls`, the `--loading`
 * label state) so request/response (and anything else) can slot into it.
 *
 * @category Components
 */
export function Collapsible({
  label,
  labelLoading,
  loading = false,
  defaultOpen = false,
  children,
}: {
  label: string;
  /** Shimmering label shown while `loading` is `true` (falls back to `label`). */
  labelLoading?: string;
  loading?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultOpen);
  const panelId = useId();
  const labelId = useId();
  const shownLabel = loading && labelLoading ? labelLoading : label;

  return (
    <div className="openui-tool-code-block">
      <button
        className="openui-tool-code-block__header"
        type="button"
        aria-expanded={isExpanded}
        aria-controls={panelId}
        onClick={() => setIsExpanded((v) => !v)}
      >
        <span
          id={labelId}
          className={clsx("openui-tool-code-block__label", {
            "openui-tool-code-block__label--loading": loading,
          })}
        >
          {shownLabel}
        </span>
        <ChevronDown
          size={14}
          className={clsx("openui-tool-code-block__chevron", {
            "openui-tool-code-block__chevron--expanded": isExpanded,
          })}
        />
      </button>
      {isExpanded && (
        <div
          className="openui-tool-code-block__content"
          id={panelId}
          role="region"
          aria-labelledby={labelId}
        >
          {children}
        </div>
      )}
    </div>
  );
}
