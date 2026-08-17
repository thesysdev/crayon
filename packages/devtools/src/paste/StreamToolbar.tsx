import { Pause, Play, RotateCcw, StepForward } from "lucide-react";
import type { CSSProperties } from "react";
import { CHUNK_STRATEGIES, type ChunkStrategy } from "./chunker";
import { pasteStyles as s } from "./styles";
import type { PlaybackControls } from "./usePlayback";

const SPEEDS = ["0.25", "0.5", "1", "2", "4", "8"];
const ICON = { size: 14 };

export interface StreamSettings {
  strategy: ChunkStrategy;
  onStrategyChange: (s: ChunkStrategy) => void;
  seed: number;
  onSeedChange: (n: number) => void;
}

function groupStyle(primary: boolean, disabled: boolean, first: boolean, last: boolean): CSSProperties {
  return {
    ...s.groupButton,
    ...(primary ? s.groupButtonPrimary : null),
    ...(disabled ? s.groupButtonDisabled : null),
    borderTopLeftRadius: first ? 8 : 0,
    borderBottomLeftRadius: first ? 8 : 0,
    borderTopRightRadius: last ? 8 : 0,
    borderBottomRightRadius: last ? 8 : 0,
    marginLeft: first ? 0 : -1,
  };
}

export function StreamToolbar({
  playback,
  settings,
  bigInput,
  disabled,
}: {
  playback: PlaybackControls;
  settings: StreamSettings;
  bigInput: boolean;
  disabled?: boolean;
}) {
  const { state, start, pause, resume, step, reset, setSpeed, speed } = playback;
  const playbackActive = state.status === "playing" || state.status === "paused";
  const settingsLocked = disabled || playbackActive;
  const { strategy, onStrategyChange, seed, onSeedChange } = settings;

  return (
    <div style={s.toolbar}>
      <div style={s.btnGroup} role="group" aria-label="Playback controls">
        {state.status === "playing" ? (
          <button
            style={groupStyle(true, !!disabled, true, false)}
            onClick={pause}
            disabled={disabled}
            aria-label="Pause"
            title="Pause"
          >
            <Pause {...ICON} />
          </button>
        ) : state.status === "paused" ? (
          <button
            style={groupStyle(true, !!disabled, true, false)}
            onClick={resume}
            disabled={disabled}
            aria-label="Resume"
            title="Resume"
          >
            <Play {...ICON} />
          </button>
        ) : (
          <button
            style={groupStyle(true, !!disabled, true, false)}
            onClick={() => start({ strategy, seed })}
            disabled={disabled}
            aria-label="Stream"
            title="Stream (replay as simulated LLM output)"
          >
            <Play {...ICON} />
          </button>
        )}
        <button
          style={groupStyle(false, !!disabled || state.status !== "paused", false, false)}
          onClick={step}
          disabled={disabled || state.status !== "paused"}
          aria-label="Step one chunk"
          title="Step one chunk"
        >
          <StepForward {...ICON} />
        </button>
        <button
          style={groupStyle(false, !!disabled || state.status === "idle", false, true)}
          onClick={reset}
          disabled={disabled || state.status === "idle"}
          aria-label="Reset playback"
          title="Reset playback"
        >
          <RotateCcw {...ICON} />
        </button>
      </div>
      {state.totalChunks > 0 ? (
        <span style={s.progress}>
          {state.chunkIndex}/{state.totalChunks}
          {state.emulated ? " · emulated" : ""}
        </span>
      ) : null}

      <div style={s.field}>
        <span style={s.label}>Chunks</span>
        <select
          style={s.select}
          value={strategy}
          onChange={(event) => onStrategyChange(event.target.value as ChunkStrategy)}
          disabled={settingsLocked}
          aria-label="Chunk strategy"
        >
          {CHUNK_STRATEGIES.map((item) => (
            <option key={item.id} value={item.id} disabled={item.id === "char" && bigInput}>
              {item.label}
              {item.id === "char" && bigInput ? " (input too large)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div style={s.field}>
        <span style={s.label}>Speed</span>
        <select
          style={s.select}
          value={String(speed)}
          onChange={(event) => setSpeed(Number(event.target.value))}
          disabled={disabled}
          aria-label="Playback speed"
        >
          {SPEEDS.map((item) => (
            <option key={item} value={item}>
              {item}×
            </option>
          ))}
        </select>
      </div>

      <div style={s.field}>
        <span style={s.label}>Seed</span>
        <input
          style={s.seedInput}
          type="number"
          value={seed}
          onChange={(event) => onSeedChange(Number(event.target.value) || 0)}
          disabled={settingsLocked || strategy !== "llm"}
          aria-label="Chunk seed"
        />
      </div>
    </div>
  );
}
