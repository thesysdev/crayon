import { CheckCircle2 } from "lucide-react";
import { groupByCode, type ValidationOutcome } from "../lib";
import { useDebugStyles } from "../styles";

export function ValidationPanel({ outcome }: { outcome: ValidationOutcome }) {
  const s = useDebugStyles();
  const { result, fatal } = outcome;

  if (fatal) {
    return (
      <div style={s.panelScroll}>
        <div style={s.fatalCard}>
          <strong>Parser threw</strong>
          <pre style={s.fatalPre}>{fatal}</pre>
        </div>
      </div>
    );
  }
  if (!result) {
    return <div style={s.panelEmpty}>Add some OpenUI Lang to validate it.</div>;
  }

  const { meta } = result;
  const groups = groupByCode(meta.errors);

  return (
    <div style={s.panelScroll}>
      <div style={s.metaStrip}>
        <span style={s.tag}>Statements: {meta.statementCount}</span>
        <span style={{ ...s.tag, ...(meta.incomplete ? s.tagWarning : s.tagSuccess) }}>
          {meta.incomplete ? "Incomplete" : "Complete"}
        </span>
        <span style={{ ...s.tag, ...(result.root ? s.tagSuccess : s.tagWarning) }}>
          Root: {result.root ? result.root.typeName : "none"}
        </span>
        {meta.unresolved.map((item) => (
          <span key={item} style={{ ...s.tag, ...s.tagWarning }}>
            unresolved: {item}
          </span>
        ))}
        {meta.orphaned.map((item) => (
          <span key={item} style={s.tag}>
            orphaned: {item}
          </span>
        ))}
      </div>

      {meta.errors.length === 0 ? (
        <div style={s.allClear}>
          <CheckCircle2 size={16} /> No validation errors
        </div>
      ) : (
        [...groups.entries()].map(([code, errors]) => (
          <section key={code} style={s.errorGroup}>
            <h3 style={s.errorGroupTitle}>
              <code>{code}</code> <span style={s.count}>({errors.length})</span>
            </h3>
            <ul style={s.errorList}>
              {errors.map((error, index) => (
                <li key={`${error.path}-${index}`} style={s.errorRow}>
                  <div style={s.errHead}>
                    <code style={s.errComponent}>{error.component}</code>
                    <code style={s.errPath}>{error.path}</code>
                    {error.statementId ? <span style={s.tag}>{error.statementId}</span> : null}
                  </div>
                  <p style={s.errMessage}>{error.message}</p>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
