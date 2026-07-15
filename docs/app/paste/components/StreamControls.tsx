"use client";

import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@openuidev/react-ui";
import { Pause, Play, RotateCcw, StepForward } from "lucide-react";
import { useState } from "react";
import { CHUNK_STRATEGIES, type ChunkStrategy } from "@paste/lib/streaming/chunker";
import type { PlaybackControls } from "@paste/lib/streaming/usePlayback";

const SPEEDS = ["0.25", "0.5", "1", "2", "4", "8"];
const ICON = { size: 14 };

export function StreamControls({
  playback,
  bigInput,
}: {
  playback: PlaybackControls;
  bigInput: boolean;
}) {
  const [strategy, setStrategy] = useState<ChunkStrategy>("llm");
  const [seed, setSeed] = useState(42);
  const { state, start, pause, resume, step, reset, setSpeed, speed } = playback;
  const active = state.status === "playing" || state.status === "paused";

  return (
    <div className="stream-controls">
      {state.status === "playing" ? (
        <Button variant="primary" size="small" iconLeft={<Pause {...ICON} />} onClick={pause}>
          Pause
        </Button>
      ) : state.status === "paused" ? (
        <Button variant="primary" size="small" iconLeft={<Play {...ICON} />} onClick={resume}>
          Resume
        </Button>
      ) : (
        <Button
          variant="primary"
          size="small"
          iconLeft={<Play {...ICON} />}
          onClick={() => start({ strategy, seed })}
        >
          Stream
        </Button>
      )}
      <Button
        variant="secondary"
        size="small"
        iconLeft={<StepForward {...ICON} />}
        onClick={step}
        disabled={state.status !== "paused"}
      >
        Step
      </Button>
      <Button
        variant="secondary"
        size="small"
        iconLeft={<RotateCcw {...ICON} />}
        onClick={reset}
        disabled={state.status === "idle"}
      >
        Reset
      </Button>

      <div className="toolbar-field">
        <Label className="toolbar-label">Chunks</Label>
        <Select
          value={strategy}
          onValueChange={(v) => setStrategy(v as ChunkStrategy)}
          disabled={active}
          size="sm"
        >
          <SelectTrigger size="sm" aria-label="Chunk strategy">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CHUNK_STRATEGIES.map((s) => (
              <SelectItem key={s.id} value={s.id} disabled={s.id === "char" && bigInput}>
                {s.label}
                {s.id === "char" && bigInput ? " (input too large)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="toolbar-field">
        <Label className="toolbar-label">Speed</Label>
        <Select value={String(speed)} onValueChange={(v) => setSpeed(Number(v))} size="sm">
          <SelectTrigger size="sm" aria-label="Playback speed">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SPEEDS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}×
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="toolbar-field">
        <Label className="toolbar-label">Seed</Label>
        <Input
          type="number"
          size="small"
          className="seed-input"
          value={seed}
          onChange={(e) => setSeed(Number(e.target.value) || 0)}
          disabled={active || strategy !== "llm"}
        />
      </div>

      {state.totalChunks > 0 && (
        <span className="stream-progress">
          {state.chunkIndex}/{state.totalChunks}
          {state.emulated && " · emulated"}
        </span>
      )}
    </div>
  );
}
