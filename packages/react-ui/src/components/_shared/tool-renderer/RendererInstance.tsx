import {
  useDetailedView,
  useThreadContextStore,
  type ArtifactRendererConfig,
  type ArtifactRendererControls,
} from "@openuidev/react-headless";
import { useEffect, useId, useMemo } from "react";
import { DetailedViewPanel } from "../detailed-view";

/**
 * Renders a matched artifact renderer for a single tool call/response.
 *
 * Lifecycle:
 * 1. Run `parser({ args, response }, { isStreaming })` → `{ props, meta } | null`.
 * 2. If `meta` is non-null, register the entry (with the renderer's `type`)
 *    in the ThreadContext on mount; unregister on unmount.
 * 3. Render `preview(props, controls)` inline + `<DetailedViewPanel>` containing
 *    `actual(props, controls)` for the side panel.
 *
 * If `parser` returns `null`, renders nothing (caller should fall back).
 * If `meta` is `null`, renders inline + panel but skips ThreadContext registration —
 * a fallback `viewId` derived from `useId()` is used so `controls` remain functional.
 *
 * The same component instance is reused as a tool call transitions from
 * streaming (args partial, response null, isStreaming true) to completed
 * (args full, response present, isStreaming false). The parser is re-invoked
 * on each update; ThreadContext registration stays stable as long as the
 * returned `(id, version)` does not change.
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
  renderer: ArtifactRendererConfig<Props>;
  args: unknown;
  response: unknown;
  isStreaming?: boolean;
}) {
  const fallbackId = useId();
  const tcStore = useThreadContextStore();

  const parsed = useMemo(
    () => renderer.parser({ args, response }, { isStreaming }),
    [renderer, args, response, isStreaming],
  );
  const meta = parsed?.meta ?? null;

  // viewId derives from meta when present, otherwise from React's useId
  // so `controls.open` still works for an inline-only renderer.
  const viewId = meta ? `${meta.id}:${meta.version}` : fallbackId;

  // Register entry on mount; unregister on unmount or when (id, version) changes.
  // Heading/type-only changes upsert via the store's idempotent registerArtifact.
  useEffect(() => {
    if (!meta) return;
    tcStore.getState().registerArtifact({ ...meta, type: renderer.type });
    return () => tcStore.getState().unregisterArtifact(meta.id, meta.version);
  }, [tcStore, renderer.type, meta?.id, meta?.version, meta?.heading]); // eslint-disable-line react-hooks/exhaustive-deps

  const { isActive, open, close, toggle } = useDetailedView(viewId);

  if (parsed === null) return null;

  const controls: ArtifactRendererControls = {
    isActive,
    open,
    close,
    toggle,
    isStreaming,
  };

  return (
    <>
      {renderer.preview(parsed.props, controls)}
      <DetailedViewPanel viewId={viewId} title={meta?.heading ?? "Detailed view"}>
        {renderer.actual(parsed.props, controls)}
      </DetailedViewPanel>
    </>
  );
}
