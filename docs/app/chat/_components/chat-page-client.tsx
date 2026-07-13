"use client";

import { DemoCreditsDialog } from "@/components/DemoCreditsDialog";
import { OPENUI_CLOUD_UNAVAILABLE_MESSAGE } from "@/lib/openui-cloud/errors";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useState, type ErrorInfo, type ReactNode } from "react";
import styles from "../chat-page.module.css";
import { OssAgentSurface } from "./agent-surfaces/oss-agent-surface";
import { ChatPageHeader } from "./chat-page-header";
import type { ChatMode, CloudAvailability } from "./chat-types";

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

  const handleCloudUnavailable = useCallback(() => {
    setCloudFailed(true);
    setAvailability("unavailable");
  }, []);

  const handleCreditsExhausted = useCallback(() => {
    setCreditsDialogOpen(true);
  }, []);

  const requestModeChange = useCallback(
    (nextMode: ChatMode) => {
      if (nextMode === mode) return;
      if (nextMode === "cloud" && (availability !== "available" || cloudFailed)) return;

      setMode(nextMode);
      setAnnouncement(
        `${nextMode === "oss" ? "OpenUI OSS" : "OpenUI Cloud"} mode selected. New chat started.`,
      );
    },
    [availability, cloudFailed, mode],
  );

  return (
    <main className={styles.page}>
      <h1 className={styles.srOnly}>OpenUI Chat</h1>
      <ChatPageHeader
        mode={mode}
        availability={availability}
        cloudFailed={cloudFailed}
        onModeChange={requestModeChange}
      />

      <section
        className={styles.agentViewport}
        aria-label={`${mode === "oss" ? "OpenUI OSS" : "OpenUI Cloud"} chat`}
      >
        {mode === "oss" ? (
          <OssAgentSurface themeMode={themeMode} onCreditsExhausted={handleCreditsExhausted} />
        ) : cloudFailed ? (
          <CloudUnavailableState />
        ) : (
          <CloudSurfaceErrorBoundary onUnavailable={handleCloudUnavailable}>
            <CloudAgentSurface themeMode={themeMode} onUnavailable={handleCloudUnavailable} />
          </CloudSurfaceErrorBoundary>
        )}
      </section>

      <p className={styles.srOnly} aria-live="polite">
        {announcement}
      </p>

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
      <p>{OPENUI_CLOUD_UNAVAILABLE_MESSAGE}</p>
    </div>
  );
}
