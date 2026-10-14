import type { Definition } from "../../core/schemas";

export interface DefinitionTipProps {
  /** Referenced by the element it describes, through aria-describedby. */
  id: string;
  definition: Definition;
}

/**
 * How a metric is calculated: its formula, the time it covers, and where the
 * numbers come from. Rendered next to the element it describes and shown when
 * that element's wrapper (`.kit-def-host`) is hovered or holds focus.
 */
export function DefinitionTip({ id, definition }: DefinitionTipProps) {
  return (
    <span id={id} role="tooltip" className="kit-def">
      <span className="kit-def__formula">{definition.formula}</span>
      <span className="kit-def__row">
        <span className="kit-def__key">Window</span> {definition.window}
      </span>
      {definition.basis && (
        <span className="kit-def__row">
          <span className="kit-def__key">Basis</span> {definition.basis}
        </span>
      )}
    </span>
  );
}
