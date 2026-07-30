import {
  createStore,
  createStreamingParser,
  evaluateElementProps,
  type EvaluationContext,
  type Library,
  type ParseResult,
  type Store,
} from "@openuidev/lang-core";
import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import type { TuiContextValue } from "./context.js";

/** Unwrap the { value, componentType } wrapper the store keeps for form fields. */
function unwrap(v: unknown): unknown {
  if (v && typeof v === "object" && !Array.isArray(v) && "value" in (v as Record<string, unknown>)) {
    return (v as Record<string, unknown>).value;
  }
  return v;
}

export interface GenUiState {
  /** Evaluated parse result (props resolved to concrete values). */
  result: ParseResult | null;
  ctx: TuiContextValue;
}

/**
 * Trimmed, terminal-oriented port of react-lang's useOpenUIState: streaming
 * parse → runtime store → evaluate props → action/field helpers. No queries or
 * DOM. `messageId` scopes the parser to a single assistant turn.
 */
export function useGenUi(
  library: Library,
  messageId: string | null,
  response: string | null,
  isStreaming: boolean,
  onSend: (content: string) => void,
): GenUiState {
  const onSendRef = useRef(onSend);
  onSendRef.current = onSend;

  // Fresh streaming parser per assistant turn (set() resets on replacement anyway).
  const sp = useMemo(
    () => createStreamingParser(library.toJSONSchema(), library.root),
    [library, messageId],
  );

  const parseResult = useMemo<ParseResult | null>(() => {
    if (!response) return null;
    try {
      return sp.set(response);
    } catch {
      return null;
    }
  }, [sp, response]);

  const store = useMemo<Store>(() => createStore(), [messageId]);

  useEffect(() => {
    store.initialize(parseResult?.stateDeclarations ?? {}, {});
  }, [parseResult?.stateDeclarations, store]);

  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  const evaluationContext = useMemo<EvaluationContext>(
    () => ({
      getState: (name: string) => unwrap(store.get(name)),
      resolveRef: () => undefined,
    }),
    [store],
  );

  const result = useMemo<ParseResult | null>(() => {
    if (!parseResult?.root) return parseResult;
    try {
      const root = evaluateElementProps(parseResult.root, {
        ctx: evaluationContext,
        library,
        store,
        errors: [],
      });
      return { ...parseResult, root };
    } catch {
      return parseResult;
    }
    // snapshot is a dependency so form edits re-evaluate reactive props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parseResult, evaluationContext, library, store, snapshot]);

  const getFieldValue = useCallback<TuiContextValue["getFieldValue"]>(
    (formName, name) => {
      if (!formName) return unwrap(store.get(name));
      const formData = store.get(formName);
      if (!formData || typeof formData !== "object" || Array.isArray(formData)) return undefined;
      return unwrap((formData as Record<string, unknown>)[name]);
    },
    [store],
  );

  const setFieldValue = useCallback<TuiContextValue["setFieldValue"]>(
    (formName, componentType, name, value) => {
      const wrapped = { value, componentType };
      if (!formName) {
        store.set(name, wrapped);
        return;
      }
      const raw = store.get(formName);
      const formData =
        raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
      store.set(formName, { ...formData, [name]: wrapped });
    },
    [store],
  );

  const triggerAction = useCallback<TuiContextValue["triggerAction"]>(
    (userMessage, formName, action) => {
      let message = userMessage;
      const steps =
        action && typeof action === "object" && Array.isArray((action as { steps?: unknown }).steps)
          ? ((action as { steps: { type?: string; message?: string }[] }).steps)
          : null;
      if (steps) {
        const toAssistant = steps.find((s) => s?.type === "continue_conversation" || typeof s?.message === "string");
        if (toAssistant?.message) message = toAssistant.message;
      }

      let content = message;
      if (formName) {
        const raw = store.get(formName);
        const values: Record<string, unknown> = {};
        if (raw && typeof raw === "object" && !Array.isArray(raw)) {
          for (const [k, v] of Object.entries(raw as Record<string, unknown>)) values[k] = unwrap(v);
        }
        content = `${message}\n\n[form "${formName}" values: ${JSON.stringify(values)}]`;
      }
      onSendRef.current(content);
    },
    [store],
  );

  const ctx = useMemo<TuiContextValue>(
    () => ({ library, triggerAction, getFieldValue, setFieldValue }),
    [library, triggerAction, getFieldValue, setFieldValue],
  );

  // isStreaming currently only affects display in the app; kept for parity/future use.
  void isStreaming;

  return { result, ctx };
}
