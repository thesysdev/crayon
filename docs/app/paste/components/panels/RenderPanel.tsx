"use client";

import { Renderer } from "@openuidev/react-lang";
import { FlaskConical } from "lucide-react";
import { useMemo, useState } from "react";
import { getLibrary, type LibraryId } from "@paste/lib/libraries";
import { createMockToolProvider, type MockToolCall } from "@paste/lib/mockTools";
import { BUNDLED_LANG_CORE_VERSION } from "@paste/lib/versions/loader";
import type { OpenUIError } from "@paste/lib/versions/types";
import { RenderErrorBoundary } from "../RenderErrorBoundary";

const TOOL_CALL_LOG_CAP = 20;

export function RenderPanel({
  code,
  libraryId,
  isStreaming,
  selectedVersion,
}: {
  code: string;
  libraryId: LibraryId;
  isStreaming: boolean;
  selectedVersion: string;
}) {
  const [runtimeErrors, setRuntimeErrors] = useState<OpenUIError[]>([]);
  const [formState, setFormState] = useState<Record<string, unknown>>({});
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [toolCalls, setToolCalls] = useState<MockToolCall[]>([]);

  // Stale logs from a previous snippet are misleading — reset when the code
  // changes (render-time state adjustment, not an effect). Skipped while
  // streaming, where `code` grows chunk by chunk and calls should accumulate.
  const [lastCode, setLastCode] = useState(code);
  if (code !== lastCode && !isStreaming) {
    setLastCode(code);
    setToolCalls([]);
    setActionLog([]);
  }
  // Mounted with key={libraryId}, so switching library remounts the panel and
  // clears stale runtime errors / form state / logs naturally.
  const library = getLibrary(libraryId).library;

  const toolProvider = useMemo(
    () =>
      createMockToolProvider((call) =>
        setToolCalls((log) => [...log.slice(-(TOOL_CALL_LOG_CAP - 1)), call]),
      ),
    [],
  );

  const usesTools = /\b(Query|Mutation)\s*\(/.test(code);

  return (
    <div className="render-panel">
      {selectedVersion !== BUNDLED_LANG_CORE_VERSION && (
        <p className="render-seam">
          Rendered with bundled lang-core {BUNDLED_LANG_CORE_VERSION} — validation uses v
          {selectedVersion}.
        </p>
      )}
      {usesTools && (
        <p className="mock-note">
          <FlaskConical size={13} aria-hidden />
          <span>
            <code>Query()</code> and <code>Mutation()</code> run against a{" "}
            <strong>mock tool provider</strong>: any tool name resolves with sample data after
            ~400ms. Calls are logged below the canvas.
          </span>
        </p>
      )}
      <div className="render-canvas">
        <RenderErrorBoundary resetKey={`${libraryId}:${code}`}>
          <Renderer
            response={code || null}
            library={library}
            isStreaming={isStreaming}
            toolProvider={toolProvider}
            onError={setRuntimeErrors}
            onStateUpdate={setFormState}
            onAction={(event) => setActionLog((log) => [...log.slice(-19), safeDescribe(event)])}
          />
        </RenderErrorBoundary>
      </div>
      {toolCalls.length > 0 && (
        <details className="render-details" open>
          <summary>Mock tool calls ({toolCalls.length})</summary>
          <ul>
            {toolCalls.map((c, i) => (
              <li key={`${c.at}-${i}`} className="error-row">
                <code>{c.tool}</code>({safeDescribe(c.args)}) → sample data
              </li>
            ))}
          </ul>
        </details>
      )}
      {runtimeErrors.length > 0 && (
        <details className="render-details" open>
          <summary>Runtime errors ({runtimeErrors.length})</summary>
          <ul>
            {runtimeErrors.map((e, i) => (
              <li key={i} className="error-row">
                <code>{e.code}</code> {e.message}
                {e.hint && <p className="err-hint">{e.hint}</p>}
              </li>
            ))}
          </ul>
        </details>
      )}
      {actionLog.length > 0 && (
        <details className="render-details">
          <summary>Actions ({actionLog.length})</summary>
          <pre className="tree-json">{actionLog.join("\n")}</pre>
        </details>
      )}
      {Object.keys(formState).length > 0 && (
        <details className="render-details">
          <summary>Form state</summary>
          <pre className="tree-json">{JSON.stringify(formState, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}

function safeDescribe(event: unknown): string {
  try {
    return JSON.stringify(event);
  } catch {
    return String(event);
  }
}
