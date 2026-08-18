import { FlaskConical } from "lucide-react";
import { useMemo, useState, type ComponentType } from "react";
import type { PasteLibrary } from "../../libraryRegistry";
import { createMockToolProvider, type MockToolCall } from "../mockTools";
import { pasteStyles as s } from "../styles";
import type { LangModule } from "../types";

const TOOL_CALL_LOG_CAP = 20;

function safeDescribe(event: unknown): string {
  try {
    return JSON.stringify(event);
  } catch {
    return String(event);
  }
}

function isOpenUIError(error: unknown): error is {
  code?: string;
  message?: string;
  hint?: string;
  component?: string;
  path?: string;
  statementId?: string;
} {
  return !!error && typeof error === "object";
}

function ErrorRow({ error }: { error: unknown }) {
  if (isOpenUIError(error) && (error.message || error.code)) {
    return (
      <li style={s.errorRow}>
        <div style={s.errHead}>
          {error.code ? <code style={s.errComponent}>{error.code}</code> : null}
          {error.component ? <code style={s.errPath}>{error.component}</code> : null}
          {error.path ? <code style={s.errPath}>{error.path}</code> : null}
          {error.statementId ? <span style={s.tag}>{error.statementId}</span> : null}
        </div>
        {error.message ? <p style={s.errMessage}>{error.message}</p> : null}
        {error.hint ? <p style={s.errHint}>{error.hint}</p> : null}
      </li>
    );
  }
  return <li style={s.errorRow}>{safeDescribe(error)}</li>;
}

export function RenderPanel({
  Renderer,
  library,
  code,
  isStreaming,
}: {
  Renderer: LangModule["Renderer"] | ComponentType<{ response: string | null; library: unknown }>;
  library: PasteLibrary;
  code: string;
  isStreaming: boolean;
}) {
  const [runtimeErrors, setRuntimeErrors] = useState<unknown[]>([]);
  const [formState, setFormState] = useState<Record<string, unknown>>({});
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [toolCalls, setToolCalls] = useState<MockToolCall[]>([]);
  const [lastCode, setLastCode] = useState(code);
  if (code !== lastCode && !isStreaming) {
    setLastCode(code);
    setToolCalls([]);
    setActionLog([]);
  }

  const toolProvider = useMemo(
    () =>
      createMockToolProvider((call) =>
        setToolCalls((log) => [...log.slice(-(TOOL_CALL_LOG_CAP - 1)), call]),
      ),
    [],
  );

  const usesTools = /\b(Query|Mutation)\s*\(/.test(code);
  // Whitespace-only input has nothing to render. Handing it to the Renderer anyway
  // reports a "parse-failed" error that then sticks around, since an empty editor
  // never produces another report to replace it. runValidation() guards the same way.
  const source = code.trim() ? code : null;

  return (
    <div style={s.renderPanel}>
      {usesTools ? (
        <p style={s.mockNote}>
          <FlaskConical size={13} aria-hidden />
          <span>
            <code>Query()</code> and <code>Mutation()</code> run against a mock tool provider. Calls
            are logged below the canvas.
          </span>
        </p>
      ) : null}
      <div style={s.renderCanvas}>
        <Renderer
          response={source}
          library={library}
          isStreaming={isStreaming}
          publishObservability={false}
          toolProvider={toolProvider}
          onError={setRuntimeErrors}
          onStateUpdate={setFormState}
          onAction={(event) => setActionLog((log) => [...log.slice(-19), safeDescribe(event)])}
        />
      </div>
      {toolCalls.length > 0 ? (
        <details style={s.renderDetails} open>
          <summary>Mock tool calls ({toolCalls.length})</summary>
          <ul style={s.errorList}>
            {toolCalls.map((call, index) => (
              <li key={`${call.at}-${index}`} style={s.errorRow}>
                <code>{call.tool}</code>({safeDescribe(call.args)}) → sample data
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      {source && runtimeErrors.length > 0 ? (
        <details style={s.renderDetails} open>
          <summary>Runtime errors ({runtimeErrors.length})</summary>
          <ul style={s.errorList}>
            {runtimeErrors.map((error, index) => (
              <ErrorRow key={index} error={error} />
            ))}
          </ul>
        </details>
      ) : null}
      {actionLog.length > 0 ? (
        <details style={s.renderDetails}>
          <summary>Actions ({actionLog.length})</summary>
          <pre style={s.treeJson}>{actionLog.join("\n")}</pre>
        </details>
      ) : null}
      {Object.keys(formState).length > 0 ? (
        <details style={s.renderDetails}>
          <summary>Form state</summary>
          <pre style={s.treeJson}>{JSON.stringify(formState, null, 2)}</pre>
        </details>
      ) : null}
    </div>
  );
}
