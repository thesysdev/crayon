import type { ActionEvent, OpenUIError, ParseResult } from "@openuidev/lang-core";
import {
  Renderer as OpenUIRenderer,
  type Library,
  type RendererProps as OpenUIRendererProps,
} from "@openuidev/react-lang";
import { useCallback, useSyncExternalStore } from "react";
import type { A2UILangClient } from "./client";
import { dataModelToOpenUIState } from "./json-pointer";
import type { JsonValue, MapOpenUIAction, OpenUIActionOptions, SurfaceSnapshot } from "./types";

export interface A2UILangRendererProps {
  client: A2UILangClient;
  surfaceId: string;
  library: Library;
  mapAction?: MapOpenUIAction;
  onAction?: (event: ActionEvent, surface: SurfaceSnapshot) => void;
  onActionResponse?: (value: JsonValue, event: ActionEvent) => void;
  onActionResponseError?: (error: Error, event: ActionEvent) => void;
  onStateUpdate?: (state: Record<string, unknown>, surface: SurfaceSnapshot) => void;
  onParseResult?: (result: ParseResult | null) => void;
  onError?: (errors: OpenUIError[]) => void;
  toolProvider?: OpenUIRendererProps["toolProvider"];
  queryLoader?: OpenUIRendererProps["queryLoader"];
}

export function A2UILangRenderer({
  client,
  surfaceId,
  library,
  mapAction,
  onAction,
  onActionResponse,
  onActionResponseError,
  onStateUpdate,
  onParseResult,
  onError,
  toolProvider,
  queryLoader,
}: A2UILangRendererProps) {
  const subscribe = useCallback((notify: () => void) => client.subscribe(notify), [client]);
  const getSnapshot = useCallback(() => client.getSurface(surfaceId), [client, surfaceId]);
  const surface = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const handleAction = useCallback(
    (event: ActionEvent) => {
      const current = client.getSurface(surfaceId);
      if (!current) return;
      const options: OpenUIActionOptions = mapAction?.(event, current) ?? {};
      const response = client.dispatchOpenUIAction(surfaceId, event, options);
      if (response) {
        void response
          .then((value) => onActionResponse?.(value, event))
          .catch((error: unknown) =>
            onActionResponseError?.(
              error instanceof Error ? error : new Error(String(error)),
              event,
            ),
          );
      }
      onAction?.(event, current);
    },
    [client, mapAction, onAction, onActionResponse, onActionResponseError, surfaceId],
  );

  const handleStateUpdate = useCallback(
    (state: Record<string, unknown>) => {
      if (!client.updateSurfaceFromOpenUIState(surfaceId, state)) return;
      const current = client.getSurface(surfaceId);
      if (current) onStateUpdate?.(state, current);
    },
    [client, onStateUpdate, surfaceId],
  );

  if (!surface) return null;

  return (
    <OpenUIRenderer
      response={surface.source}
      library={library}
      initialState={dataModelToOpenUIState(surface.dataModel)}
      onAction={handleAction}
      onStateUpdate={handleStateUpdate}
      onParseResult={onParseResult}
      onError={onError}
      toolProvider={toolProvider}
      queryLoader={queryLoader}
    />
  );
}
