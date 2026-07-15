"use client";

import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tag,
} from "@openuidev/react-ui";
// DOCS-PORT DIVERGENCE: back-to-docs link (same pattern as /chat).
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { VersionListState } from "@paste/hooks/useVersionList";
import { EXAMPLES } from "@paste/lib/examples";
import { LIBRARIES, type LibraryId } from "@paste/lib/libraries";
import type { PlaybackControls } from "@paste/lib/streaming/usePlayback";
import type { LoadedLangCore } from "@paste/lib/versions/types";
import { HelpDialog } from "./HelpDialog";
import { StreamControls } from "./StreamControls";
import { VersionPicker } from "./VersionPicker";

export function Toolbar({
  libraryId,
  onLibraryChange,
  version,
  onVersionChange,
  versions,
  loaded,
  onLoadExample,
  playback,
  bigInput,
}: {
  libraryId: LibraryId;
  onLibraryChange: (id: LibraryId) => void;
  version: string;
  onVersionChange: (v: string) => void;
  versions: VersionListState;
  loaded: LoadedLangCore | null;
  onLoadExample: (code: string) => void;
  playback: PlaybackControls;
  bigInput: boolean;
}) {
  const playbackActive =
    playback.state.status === "playing" || playback.state.status === "paused";

  return (
    <>
      <header className="topbar">
        <Link className="back-link" href="/" prefetch={false}>
          <ArrowLeft aria-hidden size={16} />
          <span>Back to docs</span>
        </Link>
        <span className="toolbar-logo">OpenUI Paste</span>
      </header>
      <div className="toolbar">
        <div className="toolbar-controls">
        <StreamControls playback={playback} bigInput={bigInput} />
        <span className="toolbar-divider" aria-hidden />
        <div className="toolbar-field">
          <Label className="toolbar-label">Library</Label>
          <Select
            value={libraryId}
            onValueChange={(v) => onLibraryChange(v as LibraryId)}
            disabled={playbackActive}
            size="sm"
          >
            <SelectTrigger size="sm" aria-label="Component library">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LIBRARIES.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <VersionPicker
          value={version}
          onChange={onVersionChange}
          versions={versions}
          disabled={playbackActive}
        />
        <div className="toolbar-field">
          <Label className="toolbar-label">Examples</Label>
          {/* value stays "" so the same example can be re-selected */}
          <Select
            value=""
            onValueChange={(id) => {
              const ex = EXAMPLES.find((x) => x.id === id);
              if (ex) onLoadExample(ex.code);
            }}
            disabled={playbackActive}
            size="sm"
          >
            <SelectTrigger size="sm" aria-label="Load example">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {EXAMPLES.map((ex) => (
                <SelectItem key={ex.id} value={ex.id}>
                  {ex.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
          {loaded && loaded.source !== "bundled" && (
            <Tag size="sm" variant="info" text={`via ${loaded.source}`} />
          )}
          <HelpDialog />
        </div>
      </div>
    </>
  );
}
