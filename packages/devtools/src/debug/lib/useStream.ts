import { useCallback, useState } from "react";
import type { ChunkStrategy } from "./chunker";
import type { LangModule, LibrarySchema, ValidationOutcome } from "./types";
import { usePlayback, type PlaybackControls, type PlaybackState } from "./usePlayback";

const CHAR_STRATEGY_LIMIT = 50 * 1024;

export interface StreamSettings {
  strategy: ChunkStrategy;
  onStrategyChange: (s: ChunkStrategy) => void;
  seed: number;
  onSeedChange: (n: number) => void;
}

/**
 * Streaming controls for Debug: chunk strategy, seed, and the playback engine.
 * DebugUI keeps validation and layout; this hook is the Stream toolbar + the
 * prefix that panels show while a replay is running.
 */
export function useStream({
  code,
  lang,
  schema,
  rootName,
  outcome,
}: {
  code: string;
  lang: LangModule | null | undefined;
  schema: LibrarySchema | null;
  rootName: string | undefined;
  outcome: ValidationOutcome;
}): {
  playback: PlaybackControls;
  settings: StreamSettings;
  state: PlaybackState;
  active: boolean;
  isStreaming: boolean;
  disabled: boolean;
  displayed: ValidationOutcome;
  renderedCode: string;
  bigInput: boolean;
  prepareEdit: () => void;
} {
  const playback = usePlayback(code, lang, schema, rootName);
  const [strategy, setStrategy] = useState<ChunkStrategy>("llm");
  const [seed, setSeed] = useState(42);
  const { state, reset } = playback;
  const active = state.status === "playing" || state.status === "paused";
  const displayed =
    active || state.status === "done" ? { result: state.result, fatal: state.fatal } : outcome;

  const prepareEdit = useCallback(() => {
    if (state.status !== "idle") reset();
  }, [reset, state.status]);

  return {
    playback,
    settings: {
      strategy,
      onStrategyChange: setStrategy,
      seed,
      onSeedChange: setSeed,
    },
    state,
    active,
    isStreaming: state.status === "playing",
    disabled: !lang || !code.trim() || schema == null,
    displayed,
    renderedCode: active ? state.prefix : code,
    bigInput: code.length > CHAR_STRATEGY_LIMIT,
    prepareEdit,
  };
}
