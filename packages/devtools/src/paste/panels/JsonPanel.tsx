import { useMemo, useState } from "react";
import { pasteStyles as s } from "../styles";
import type { ParseResult } from "../types";

const COLLAPSE_BYTES = 200 * 1024;

export function JsonPanel({ result }: { result: ParseResult | null }) {
  const [forceExpand, setForceExpand] = useState(false);
  const json = useMemo(() => {
    if (!result) return null;
    try {
      return JSON.stringify(
        result,
        (_key, value) => (typeof value === "function" ? `[function]` : value === undefined ? null : value),
        2,
      );
    } catch (err) {
      return `/* could not stringify: ${err instanceof Error ? err.message : String(err)} */`;
    }
  }, [result]);

  if (!json) return <div style={s.panelEmpty}>No parse result yet.</div>;
  if (json.length > COLLAPSE_BYTES && !forceExpand) {
    return (
      <div style={s.panelScroll}>
        <p>
          Result is {(json.length / 1024).toFixed(0)} KB.{" "}
          <button type="button" onClick={() => setForceExpand(true)}>
            Expand anyway
          </button>
        </p>
      </div>
    );
  }
  return (
    <div style={s.panelScroll}>
      <pre style={s.treeJson}>{json}</pre>
    </div>
  );
}
