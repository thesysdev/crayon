"use client";

import { Renderer } from "@openuidev/react-lang";
import { useState } from "react";
import { getLibrary, type LibraryId } from "@paste/lib/libraries";
import { mockToolProvider } from "@paste/lib/mockTools";
import { BUNDLED_LANG_CORE_VERSION } from "@paste/lib/versions/loader";
import type { OpenUIError } from "@paste/lib/versions/types";
import { RenderErrorBoundary } from "../RenderErrorBoundary";

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
  // Mounted with key={libraryId}, so switching library remounts the panel and
  // clears stale runtime errors / form state / action log naturally.
  const library = getLibrary(libraryId).library;

  return (
    <div className="render-panel">
      {selectedVersion !== BUNDLED_LANG_CORE_VERSION && (
        <p className="render-seam">
          Rendered with bundled lang-core {BUNDLED_LANG_CORE_VERSION} — validation uses v
          {selectedVersion}.
        </p>
      )}
      <div className="render-canvas">
        <RenderErrorBoundary resetKey={`${libraryId}:${code}`}>
          <Renderer
            response={code || null}
            library={library}
            isStreaming={isStreaming}
            toolProvider={mockToolProvider}
            onError={setRuntimeErrors}
            onStateUpdate={setFormState}
            onAction={(event) =>
              setActionLog((log) => [...log.slice(-19), safeDescribe(event)])
            }
          />
        </RenderErrorBoundary>
      </div>
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
