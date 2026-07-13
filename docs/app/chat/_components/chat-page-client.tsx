"use client";

import { DemoCreditsDialog } from "@/components/DemoCreditsDialog";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useState, type ErrorInfo, type ReactNode } from "react";
import styles from "../chat-page.module.css";
import { OssAgentSurface } from "./agent-surfaces/oss-agent-surface";
import { ChatPageHeader } from "./chat-page-header";
import {
  INITIAL_CHAT_LIFECYCLE,
  type ChatLifecycleState,
  type ChatMode,
  type CloudAvailability,
} from "./chat-types";
import { SwitchModeDialog } from "./switch-mode-dialog";

const CloudAgentSurface = dynamic(
  () => import("./agent-surfaces/cloud-agent-surface").then((module) => module.CloudAgentSurface),
  {
    ssr: false,
    loading: () => <ChatLoadingState label="Loading OpenUI Cloud…" />,
  },
);

interface CloudSurfaceErrorBoundaryProps {
  children: ReactNode;
  onUnavailable: () => void;
}

class CloudSurfaceErrorBoundary extends Component<
  CloudSurfaceErrorBoundaryProps,
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    this.props.onUnavailable();
  }

  render() {
    if (this.state.hasError) return <CloudUnavailableState />;
    return this.props.children;
  }
}

export function ChatPageClient() {
  const { resolvedTheme } = useTheme();
  const [mode, setMode] = useState<ChatMode>("oss");
  const [availability, setAvailability] = useState<CloudAvailability>("checking");
  const [cloudFailed, setCloudFailed] = useState(false);
  const [lifecycle, setLifecycle] = useState<ChatLifecycleState>(INITIAL_CHAT_LIFECYCLE);
  const [pendingMode, setPendingMode] = useState<ChatMode | null>(null);
  const [surfaceRevision, setSurfaceRevision] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const [creditsDialogOpen, setCreditsDialogOpen] = useState(false);
  const themeMode = resolvedTheme === "dark" ? "dark" : "light";

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/openui-cloud/status", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return false;
        const payload = (await response.json()) as { enabled?: unknown };
        return payload.enabled === true;
      })
      .then((enabled) => setAvailability(enabled ? "available" : "unavailable"))
      .catch((error: unknown) => {
        if (!(error instanceof Error && error.name === "AbortError")) {
          setAvailability("unavailable");
        }
      });

    return () => controller.abort();
  }, []);

  const handleLifecycleChange = useCallback((next: ChatLifecycleState) => {
    setLifecycle((current) => {
      const hasConversation = current.hasConversation || next.hasConversation;

      return current.hasConversation === hasConversation &&
        current.isRunning === next.isRunning &&
        current.isLoading === next.isLoading
        ? current
        : { ...next, hasConversation };
    });
  }, []);

  const handleCloudUnavailable = useCallback(() => {
    setCloudFailed(true);
    setAvailability("unavailable");
    setLifecycle((current) => ({
      ...current,
      isRunning: false,
      isLoading: false,
    }));
  }, []);

  const handleCreditsExhausted = useCallback(() => {
    setCreditsDialogOpen(true);
  }, []);

  const commitModeChange = useCallback((nextMode: ChatMode) => {
    setMode(nextMode);
    setPendingMode(null);
    setLifecycle(INITIAL_CHAT_LIFECYCLE);
    setSurfaceRevision((revision) => revision + 1);
    setAnnouncement(
      `${nextMode === "oss" ? "OpenUI OSS" : "OpenUI Cloud"} mode selected. New chat started.`,
    );
  }, []);

  const requestModeChange = useCallback(
    (nextMode: ChatMode) => {
      if (nextMode === mode || lifecycle.isRunning) return;
      if (nextMode === "cloud" && (availability !== "available" || cloudFailed)) return;

      if (lifecycle.hasConversation) {
        setPendingMode(nextMode);
        return;
      }

      commitModeChange(nextMode);
    },
    [
      availability,
      cloudFailed,
      commitModeChange,
      lifecycle.hasConversation,
      lifecycle.isRunning,
      mode,
    ],
  );

  return (
    <main className={styles.page}>
      <h1 className={styles.srOnly}>OpenUI Chat</h1>
      <ChatPageHeader
        mode={mode}
        availability={availability}
        cloudFailed={cloudFailed}
        isRunning={lifecycle.isRunning}
        onModeChange={requestModeChange}
      />

      <section
        className={styles.agentViewport}
        aria-label={`${mode === "oss" ? "OpenUI OSS" : "OpenUI Cloud"} chat`}
        aria-busy={lifecycle.isLoading}
      >
        {mode === "oss" ? (
          <OssAgentSurface
            key={`oss-${surfaceRevision}`}
            themeMode={themeMode}
            onLifecycleChange={handleLifecycleChange}
            onCreditsExhausted={handleCreditsExhausted}
          />
        ) : cloudFailed ? (
          <CloudUnavailableState />
        ) : (
          <CloudSurfaceErrorBoundary
            key={`cloud-boundary-${surfaceRevision}`}
            onUnavailable={handleCloudUnavailable}
          >
            <CloudAgentSurface
              themeMode={themeMode}
              onLifecycleChange={handleLifecycleChange}
              onUnavailable={handleCloudUnavailable}
            />
          </CloudSurfaceErrorBoundary>
        )}
      </section>

      <p className={styles.srOnly} aria-live="polite">
        {announcement}
      </p>

      <SwitchModeDialog
        currentMode={mode}
        destinationMode={pendingMode}
        onCancel={() => setPendingMode(null)}
        onConfirm={() => {
          if (pendingMode) commitModeChange(pendingMode);
        }}
      />

      <DemoCreditsDialog open={creditsDialogOpen} onClose={() => setCreditsDialogOpen(false)} />
    </main>
  );
}

function ChatLoadingState({ label }: { label: string }) {
  return (
    <div className={styles.centeredState} role="status">
      <span className={styles.loadingIndicator} aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

function CloudUnavailableState() {
  return (
    <div className={styles.centeredState} role="status">
      <p>OpenUI Cloud is unavailable.</p>
    </div>
  );
}
