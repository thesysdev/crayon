"use client";

import { useArtifactStorage, type ArtifactRendererControls } from "@openuidev/react-headless";
import { Presentation, Report } from "@openuidev/thesys";
import { useEffect, useRef, useState } from "react";
import { artifactHeading, parseArtifactResult, type ArtifactProps } from "./parseArtifact";

/**
 * Inline chat preview. With the program in hand it wraps the SDK viewer's own
 * chip (preview mode, isOpen pinned false); chip clicks surface through
 * onOpenChange → controls.open() so the DetailedViewPanel owns the open state.
 * On a stripped reload the program is fetched by id (same as the full view);
 * while streaming / before that, a minimal chip shows the name.
 */
export function ArtifactPreview({
  props,
  controls,
}: {
  props: ArtifactProps;
  controls: ArtifactRendererControls;
}) {
  const storage = useArtifactStorage();
  const [fetched, setFetched] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  useEffect(() => {
    const requestId = ++requestIdRef.current;
    if (props.content !== null || props.artifactId === null || storage === null) return;
    storage
      .get(props.artifactId)
      .then((artifact) => {
        if (requestId !== requestIdRef.current) return;
        const parsed = parseArtifactResult(artifact.content);
        if (parsed?.source === "envelope" && parsed.envelope.content !== undefined)
          setFetched(parsed.envelope.content);
        else if (parsed?.source === "program") setFetched(parsed.content);
      })
      .catch(() => {
        /* leave the minimal chip in place on fetch failure */
      });
  }, [storage, props.content, props.artifactId]);

  // content IS the openui-lang program — feed it straight to the viewer.
  const dsl = props.content ?? fetched;

  if (dsl !== null) {
    const Chip = props.kind === "report" ? Report : Presentation;
    return <Chip response={dsl} isOpen={false} onOpenChange={() => controls.open()} />;
  }

  const streaming = props.phase === "streaming";
  return (
    <button
      type="button"
      onClick={() => controls.open()}
      disabled={streaming}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        border: "1px solid var(--openui-color-border, #ddd)",
        borderRadius: 8,
        padding: "12px 14px",
        margin: "8px 0",
        cursor: streaming ? "default" : "pointer",
        background: "transparent",
      }}
    >
      <strong style={{ fontSize: 14 }}>{artifactHeading(props)}</strong>
      <span style={{ fontSize: 12, opacity: 0.6, marginLeft: 8 }}>
        {props.kind === "report" ? "Report" : "Presentation"}
        {streaming ? " · generating…" : " · view"}
      </span>
    </button>
  );
}

/**
 * Full artifact view (side panel in-thread; full page in the artifact browser).
 * Hydrates the program via ArtifactStorage.get(id) when the stored envelope was
 * stripped to metadata only.
 */
export function ArtifactActual({ props }: { props: ArtifactProps }) {
  const storage = useArtifactStorage();
  const [fetched, setFetched] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    if (props.content !== null || props.artifactId === null || storage === null) return;
    storage
      .get(props.artifactId)
      .then((artifact) => {
        if (requestId !== requestIdRef.current) return;
        const parsed = parseArtifactResult(artifact.content);
        if (parsed?.source === "envelope" && parsed.envelope.content !== undefined)
          setFetched(parsed.envelope.content);
        else if (parsed?.source === "program") setFetched(parsed.content);
        else setError("Artifact content is empty or unrecognized.");
      })
      .catch((e: unknown) => {
        if (requestId !== requestIdRef.current) return;
        setError(e instanceof Error ? e.message : String(e));
      });
  }, [storage, props.content, props.artifactId]);

  // content IS the openui-lang program — feed it straight to the viewer.
  const dsl = props.content ?? fetched;
  const effectiveError =
    error ??
    (dsl === null && props.artifactId !== null && storage === null
      ? "No artifact storage configured."
      : null);

  if (effectiveError !== null && dsl === null) {
    return <div style={{ padding: 16 }}>Failed to load artifact: {effectiveError}</div>;
  }
  if (dsl === null) {
    return (
      <div style={{ padding: 16, opacity: 0.6 }}>
        {props.phase === "streaming" ? "Generating…" : "Loading…"}
      </div>
    );
  }
  const Full = props.kind === "report" ? Report : Presentation;
  return <Full response={dsl} preview={false} />;
}
