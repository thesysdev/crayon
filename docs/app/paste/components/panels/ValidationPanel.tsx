"use client";

import { Tag } from "@openuidev/react-ui";
import { CheckCircle2, Lightbulb } from "lucide-react";
import { groupByCode } from "@paste/lib/groupErrors";
import type { ValidationOutcome } from "@paste/lib/parse";
import type { OpenUIError } from "@paste/lib/versions/types";

function hintFor(enriched: OpenUIError[] | null, code: string, path: string, component: string) {
  return enriched?.find((e) => e.code === code && e.path === path && e.component === component)?.hint;
}

export function ValidationPanel({ outcome }: { outcome: ValidationOutcome }) {
  const { result, enriched, fatal } = outcome;

  if (fatal) {
    return (
      <div className="panel-scroll">
        <div className="fatal-card">
          <strong>Parser threw</strong>
          <pre>{fatal}</pre>
          <p>This can happen on old lang-core versions with a different API surface.</p>
        </div>
      </div>
    );
  }
  if (!result) return <div className="panel-empty">Paste some OpenUI Lang code to validate it.</div>;

  const { meta } = result;
  const groups = groupByCode(meta.errors);

  return (
    <div className="panel-scroll">
      <div className="meta-strip">
        <Tag size="sm" variant="neutral" text={`statements: ${meta.statementCount}`} />
        <Tag
          size="sm"
          variant={meta.incomplete ? "warning" : "success"}
          text={meta.incomplete ? "incomplete" : "complete"}
        />
        <Tag
          size="sm"
          variant={result.root ? "success" : "warning"}
          text={`root: ${result.root ? result.root.typeName : "none"}`}
        />
        {meta.unresolved.map((u) => (
          <Tag key={u} size="sm" variant="warning" text={`unresolved: ${u}`} />
        ))}
        {meta.orphaned.map((o) => (
          <Tag key={o} size="sm" variant="neutral" text={`orphaned: ${o}`} />
        ))}
      </div>

      {meta.errors.length === 0 ? (
        <div className="all-clear">
          <CheckCircle2 size={16} /> No validation errors
        </div>
      ) : (
        [...groups.entries()].map(([code, errors]) => (
          <section key={code} className="error-group">
            <h3>
              <code>{code}</code> <span className="count">({errors.length})</span>
            </h3>
            <ul>
              {errors.map((e, i) => {
                const hint = hintFor(enriched, e.code, e.path, e.component);
                return (
                  <li key={`${e.path}-${i}`} className="error-row">
                    <div className="err-head">
                      <code className="err-component">{e.component}</code>
                      <code className="err-path">{e.path}</code>
                      {e.statementId && <Tag size="sm" variant="neutral" text={e.statementId} />}
                    </div>
                    <p className="err-message">{e.message}</p>
                    {hint && (
                      <p className="err-hint">
                        <Lightbulb size={13} className="err-hint-icon" /> {hint}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
