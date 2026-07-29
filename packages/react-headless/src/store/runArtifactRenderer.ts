import type { ToolCall } from "../types";
import type { ArtifactRendererConfig, ParsedArtifact } from "./artifactRendererTypes";
import type { ToolCallStatus } from "./toolActivity";

/**
 * The pieces of a tool call a renderer's `parser` is fed from. Structurally a
 * subset of {@link ToolActivity}, so an activity can be passed directly; the
 * auto-open watcher builds one from raw messages instead.
 *
 * @category Types
 */
export interface ArtifactParseSource {
  /** The tool call owning the (possibly still-streaming) arguments. */
  toolCall: ToolCall;
  /** The tool result content, or null/undefined while it hasn't landed. */
  result?: string | null;
  /** Lifecycle of the call — `streaming`/`executing` map to `isStreaming`. */
  status: ToolCallStatus;
}

/**
 * Runs a renderer's `parser` for one tool call via the `parser` contract:
 * reconstruct the raw envelope from the typed pieces (`args` = the raw JSON
 * string, `response` = the result or null) so parsers see exactly today's
 * input. The single definition of that envelope — every caller (react-ui's
 * tool renderer, the auto-open watcher, custom hosts) must build it here so
 * they can never disagree on what a parser sees.
 *
 * Does NOT catch: a throwing parser propagates, so hosts choose their own
 * failure rendering.
 *
 * @category Utilities
 */
export function runArtifactRenderer<Props>(
  renderer: ArtifactRendererConfig<Props>,
  source: ArtifactParseSource,
): ParsedArtifact<Props> | null {
  return renderer.parser(
    { args: source.toolCall.function.arguments, response: source.result ?? null },
    { isStreaming: source.status === "streaming" || source.status === "executing" },
  );
}
