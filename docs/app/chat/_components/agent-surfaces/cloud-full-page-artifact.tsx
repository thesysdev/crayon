"use client";

import {
  useActiveDetailedView,
  useDetailedView,
  useDetailedViewStore,
  useTheme,
  type ToolDetailedViewPanel,
} from "@openuidev/react-ui";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Component, useEffect, useRef, type ReactNode } from "react";
import styles from "../../chat-page.module.css";

const CLOUD_ARTIFACT_HISTORY_KEY = "__openuiCloudArtifact";
const CLOUD_ARTIFACT_QUERY_PARAM = "cloudArtifact";

interface ArtifactErrorBoundaryProps {
  children: ReactNode;
}

interface ArtifactErrorBoundaryState {
  hasError: boolean;
}

class ArtifactErrorBoundary extends Component<
  ArtifactErrorBoundaryProps,
  ArtifactErrorBoundaryState
> {
  state: ArtifactErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ArtifactErrorBoundaryState {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className={styles.cloudArtifactError} role="alert">
          This artifact could not be rendered. Close it to return to the comparison.
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Full-viewport replacement for AgentInterface's in-thread detailed-view panel.
 * It remains inside the Cloud ChatProvider React tree, while Radix portals the
 * visual surface to `document.body` so the two comparison lanes stay mounted.
 */
export const CloudFullPageArtifactPanel: ToolDetailedViewPanel = ({
  viewId,
  title = "Artifact",
  children,
}) => {
  const { isActive, close } = useDetailedView(viewId);
  const { portalThemeClassName } = useTheme();

  return (
    <Dialog.Root
      open={isActive}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={styles.cloudArtifactOverlay} />
        <Dialog.Content
          className={`${styles.cloudArtifactDialog} ${portalThemeClassName}`}
          aria-describedby={undefined}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <header className={styles.cloudArtifactHeader}>
            <Dialog.Title className={styles.cloudArtifactTitle}>{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className={styles.cloudArtifactClose}
                aria-label="Close full-page artifact"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </Dialog.Close>
          </header>
          <div className={styles.cloudArtifactBody}>
            <ArtifactErrorBoundary key={viewId}>{children}</ArtifactErrorBoundary>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

/**
 * Gives a Cloud detailed view one same-page browser-history entry. Browser Back
 * closes the artifact first; closing through UI consumes that entry with Back.
 * An artifact version/id migration replaces the entry instead of stacking one.
 */
export function CloudArtifactHistoryBridge() {
  const { activeDetailedViewId } = useActiveDetailedView();
  const detailedViewStore = useDetailedViewStore();
  const activeIdRef = useRef(activeDetailedViewId);
  const ownsHistoryEntryRef = useRef(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    activeIdRef.current = activeDetailedViewId;
  }, [activeDetailedViewId]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const markerId = readArtifactHistoryMarker(event.state);

      if (markerId) {
        ownsHistoryEntryRef.current = true;
        if (activeIdRef.current !== markerId) {
          detailedViewStore.getState().setActiveDetailedView(markerId);
        }
        return;
      }

      ownsHistoryEntryRef.current = false;
      if (activeIdRef.current !== null) {
        detailedViewStore.getState().setActiveDetailedView(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [detailedViewStore]);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;

      // A hard refresh cannot restore the originating in-memory message tree.
      // Normalize a stale artifact marker in place rather than navigating Back.
      if (activeDetailedViewId === null && readArtifactHistoryMarker(window.history.state)) {
        window.history.replaceState(
          withoutArtifactHistoryMarker(window.history.state),
          "",
          artifactUrl(null),
        );
      }
    }

    if (activeDetailedViewId !== null) {
      const nextState = {
        ...historyStateRecord(window.history.state),
        [CLOUD_ARTIFACT_HISTORY_KEY]: activeDetailedViewId,
      };

      if (ownsHistoryEntryRef.current) {
        window.history.replaceState(nextState, "", artifactUrl(activeDetailedViewId));
      } else {
        window.history.pushState(nextState, "", artifactUrl(activeDetailedViewId));
        ownsHistoryEntryRef.current = true;
      }
      return;
    }

    if (ownsHistoryEntryRef.current) {
      ownsHistoryEntryRef.current = false;
      window.history.back();
    }
  }, [activeDetailedViewId]);

  return null;
}

function artifactUrl(artifactId: string | null): string {
  const url = new URL(window.location.href);
  if (artifactId) {
    url.searchParams.set(CLOUD_ARTIFACT_QUERY_PARAM, artifactId);
  } else {
    url.searchParams.delete(CLOUD_ARTIFACT_QUERY_PARAM);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

function historyStateRecord(state: unknown): Record<string, unknown> {
  if (typeof state !== "object" || state === null || Array.isArray(state)) return {};
  return state as Record<string, unknown>;
}

function readArtifactHistoryMarker(state: unknown): string | null {
  const marker = historyStateRecord(state)[CLOUD_ARTIFACT_HISTORY_KEY];
  return typeof marker === "string" && marker.length > 0 ? marker : null;
}

function withoutArtifactHistoryMarker(state: unknown): Record<string, unknown> {
  const nextState = { ...historyStateRecord(state) };
  delete nextState[CLOUD_ARTIFACT_HISTORY_KEY];
  return nextState;
}
