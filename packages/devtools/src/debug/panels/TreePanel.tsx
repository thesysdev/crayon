import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { ElementNode, ParseResult } from "../lib";
import { useDebugStyles } from "../styles";

function isElementNode(value: unknown): value is ElementNode {
  return !!value && typeof value === "object" && (value as { type?: unknown }).type === "element";
}

function isExprLike(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const type = (value as { type?: unknown }).type;
  return typeof type === "string" && type !== "element";
}

function safeStringify(value: unknown): string {
  try {
    const text = JSON.stringify(value);
    return text && text.length > 120 ? `${text.slice(0, 120)}…` : (text ?? String(value));
  } catch {
    return String(value);
  }
}

function PropValue({ value }: { value: unknown }) {
  const s = useDebugStyles();
  if (isElementNode(value)) return <NodeView node={value} />;
  if (Array.isArray(value)) {
    if (value.some((item) => isElementNode(item))) {
      return (
        <div style={{ minWidth: 0 }}>
          {value.map((item, index) => (
            <PropValue key={index} value={item} />
          ))}
        </div>
      );
    }
    return <code style={s.treeScalar}>{safeStringify(value)}</code>;
  }
  if (isExprLike(value)) {
    return <code style={s.treeExpr}>⟨{(value as { type: string }).type}⟩</code>;
  }
  return <code style={s.treeScalar}>{safeStringify(value)}</code>;
}

function NodeView({ node }: { node: ElementNode }) {
  const [open, setOpen] = useState(true);
  const s = useDebugStyles();
  const entries = Object.entries(node.props ?? {});
  return (
    <div style={{ minWidth: 0 }}>
      <button style={s.treeHeader} onClick={() => setOpen((value) => !value)}>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span style={s.treeType}>{node.typeName}</span>
        {node.statementId ? <span style={s.tag}>{node.statementId}</span> : null}
        {node.partial ? <span style={{ ...s.tag, ...s.tagWarning }}>partial</span> : null}
      </button>
      {open && entries.length > 0 ? (
        <dl style={s.treeProps}>
          {entries.map(([key, value]) => (
            <div key={key} style={s.treeProp}>
              <dt style={s.treeDt}>{key}</dt>
              <dd style={s.treeDd}>
                <PropValue value={value} />
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

export function TreePanel({ result }: { result: ParseResult | null }) {
  const s = useDebugStyles();
  if (!result) return <div style={s.panelEmpty}>No parse result yet.</div>;
  const state = result.stateDeclarations ?? {};
  const queries = result.queryStatements ?? [];
  const mutations = result.mutationStatements ?? [];
  return (
    <div style={s.panelScroll}>
      {result.root ? (
        <NodeView node={result.root} />
      ) : (
        <div style={s.panelEmpty}>root is null — nothing would render for this input.</div>
      )}
      {Object.keys(state).length > 0 ? (
        <section style={s.treeExtra}>
          <h3 style={s.treeExtraTitle}>State declarations</h3>
          <dl style={s.treeProps}>
            {Object.entries(state).map(([key, value]) => (
              <div key={key} style={s.treeProp}>
                <dt style={s.treeDt}>${key.replace(/^\$/, "")}</dt>
                <dd style={s.treeDd}>
                  <code style={s.treeScalar}>{safeStringify(value)}</code>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
      {queries.length > 0 ? (
        <section style={s.treeExtra}>
          <h3 style={s.treeExtraTitle}>Queries ({queries.length})</h3>
          <pre style={s.treeJson}>{safeStringify(queries)}</pre>
        </section>
      ) : null}
      {mutations.length > 0 ? (
        <section style={s.treeExtra}>
          <h3 style={s.treeExtraTitle}>Mutations ({mutations.length})</h3>
          <pre style={s.treeJson}>{safeStringify(mutations)}</pre>
        </section>
      ) : null}
    </div>
  );
}
