"use client";

import { Tag } from "@openuidev/react-ui";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { ParseResult } from "@paste/lib/versions/types";

function isElementNode(v: unknown): v is { type: "element"; typeName: string; props: Record<string, unknown>; partial?: boolean; statementId?: string } {
  return !!v && typeof v === "object" && (v as { type?: unknown }).type === "element";
}

/** AST / runtime-expression values render as ⟨…⟩ placeholders, like the harness. */
function isExprLike(v: unknown): boolean {
  if (!v || typeof v !== "object") return false;
  const t = (v as { type?: unknown }).type;
  return typeof t === "string" && t !== "element";
}

function PropValue({ value }: { value: unknown }) {
  if (isElementNode(value)) return <NodeView node={value} />;
  if (Array.isArray(value)) {
    if (value.some((v) => isElementNode(v))) {
      return (
        <div className="tree-children">
          {value.map((v, i) => (
            <PropValue key={i} value={v} />
          ))}
        </div>
      );
    }
    return <code className="tree-scalar">{safeStringify(value)}</code>;
  }
  if (isExprLike(value)) {
    return <code className="tree-expr">⟨{(value as { type: string }).type}⟩</code>;
  }
  return <code className="tree-scalar">{safeStringify(value)}</code>;
}

function safeStringify(v: unknown): string {
  try {
    const s = JSON.stringify(v);
    return s && s.length > 120 ? `${s.slice(0, 120)}…` : (s ?? String(v));
  } catch {
    return String(v);
  }
}

function NodeView({ node }: { node: { typeName: string; props: Record<string, unknown>; partial?: boolean; statementId?: string } }) {
  const [open, setOpen] = useState(true);
  const entries = Object.entries(node.props ?? {});
  return (
    <div className="tree-node">
      <button className="tree-header" onClick={() => setOpen((o) => !o)}>
        <span className="tree-caret">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <span className="tree-type">{node.typeName}</span>
        {node.statementId && <Tag size="sm" variant="neutral" text={node.statementId} />}
        {node.partial && <Tag size="sm" variant="warning" text="partial" />}
      </button>
      {open && entries.length > 0 && (
        <dl className="tree-props">
          {entries.map(([k, v]) => (
            <div key={k} className="tree-prop">
              <dt>{k}</dt>
              <dd>
                <PropValue value={v} />
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export function TreePanel({ result }: { result: ParseResult | null }) {
  if (!result) return <div className="panel-empty">No parse result yet.</div>;
  const state = result.stateDeclarations ?? {};
  const queries = result.queryStatements ?? [];
  const mutations = result.mutationStatements ?? [];
  return (
    <div className="panel-scroll">
      {result.root ? (
        <NodeView node={result.root} />
      ) : (
        <div className="panel-empty">
          root is null — the renderer would show a blank UI for this input.
        </div>
      )}
      {Object.keys(state).length > 0 && (
        <section className="tree-extra">
          <h3>State declarations</h3>
          <dl className="tree-props">
            {Object.entries(state).map(([k, v]) => (
              <div key={k} className="tree-prop">
                <dt>${k.replace(/^\$/, "")}</dt>
                <dd>
                  <code className="tree-scalar">{safeStringify(v)}</code>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      {queries.length > 0 && (
        <section className="tree-extra">
          <h3>Queries ({queries.length})</h3>
          <pre className="tree-json">{safeStringify(queries)}</pre>
        </section>
      )}
      {mutations.length > 0 && (
        <section className="tree-extra">
          <h3>Mutations ({mutations.length})</h3>
          <pre className="tree-json">{safeStringify(mutations)}</pre>
        </section>
      )}
    </div>
  );
}
