import {
  useDetailedView,
  useThreadContextStore,
  type AppRendererConfig,
  type AppRendererControls,
} from "@openuidev/react-headless";
import { useEffect, useId, useMemo } from "react";
import { DetailedViewPanel } from "../detailed-view";

/**
 * Renders a matched renderer (app or artifact) for a single tool call/response.
 *
 * Lifecycle:
 * 1. Run `parser({ args, response })` to derive Props.
 * 2. Run `meta(props, ctx)` to derive ThreadContext entry.
 * 3. If meta returns non-null, register the entry on mount; unregister on unmount.
 *    The `kind` field on the renderer routes to apps (default) or artifacts.
 * 4. Render `preview(props, controls)` inline + `<DetailedViewPanel>` containing
 *    `actual(props, controls)` for the side panel.
 *
 * If `parser` returns `null`, renders nothing (caller should fall back).
 * If `meta` returns `null`, renders inline + panel but skips ThreadContext registration —
 * a fallback `viewId` derived from `useId()` is used so `controls` remain functional.
 *
 * The same component instance is reused as a tool call transitions from
 * streaming (args partial, response null, isStreaming true) to completed
 * (args full, response present, isStreaming false). Parser + meta + render
 * functions are re-invoked on each update; ThreadContext registration stays
 * stable as long as `meta`'s `(id, version)` does not change.
 *
 * Internal — consumers should use {@link ToolMessageRenderer}.
 *
 * @internal
 */
export function RendererInstance<Props>({
  renderer,
  args,
  response,
  isStreaming = false,
}: {
  renderer: AppRendererConfig<Props>;
  args: unknown;
  response: unknown;
  isStreaming?: boolean;
}) {
  const fallbackId = useId();
  const tcStore = useThreadContextStore();

  const props = useMemo(() => renderer.parser({ args, response }), [renderer, args, response]);

  const meta = useMemo(() => {
    if (props === null) return null;
    return renderer.meta(props, { isStreaming });
  }, [renderer, props, isStreaming]);

  // viewId derives from meta when present, otherwise from React's useId
  // so `controls.open` still works for an inline-only renderer.
  const viewId = meta ? `${meta.id}:${meta.version}` : fallbackId;

  // Register entry on mount; unregister on unmount or when (id, version) changes.
  // The `kind` field on the renderer routes to the correct ThreadContext slice
  // (apps for `defineAppRenderer`, artifacts for `defineArtifactRenderer`).
  // Heading-only changes upsert via the store's idempotent register* actions.
  const kind = renderer.kind ?? "app";
  useEffect(() => {
    if (!meta) return;
    const state = tcStore.getState();
    if (kind === "artifact") {
      state.registerArtifact(meta);
      return () => tcStore.getState().unregisterArtifact(meta.id, meta.version);
    }
    state.registerApp(meta);
    return () => tcStore.getState().unregisterApp(meta.id, meta.version);
  }, [tcStore, kind, meta?.id, meta?.version, meta?.heading]); // eslint-disable-line react-hooks/exhaustive-deps

  const { isActive, open, close, toggle } = useDetailedView(viewId);

  if (props === null) return null;

  const controls: AppRendererControls = {
    isActive,
    open,
    close,
    toggle,
    isStreaming,
  };

  return (
    <>
      {renderer.preview(props, controls)}
      <DetailedViewPanel viewId={viewId} title={meta?.heading ?? "Detailed view"}>
        {renderer.actual(props, controls)}
      </DetailedViewPanel>
    </>
  );
}
