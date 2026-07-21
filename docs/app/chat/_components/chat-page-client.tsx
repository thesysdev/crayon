"use client";

import { DemoCreditsDialog } from "@/components/DemoCreditsDialog";
import { OPENUI_CLOUD_UNAVAILABLE_MESSAGE } from "@/lib/openui-cloud/errors";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { Component, useCallback, useState, type ReactNode } from "react";
import styles from "../chat-page.module.css";
import { OssAgentSurface } from "./agent-surfaces/oss-agent-surface";
import { ChatPageHeader } from "./chat-page-header";
import type { ChatMode } from "./chat-types";

const CloudAgentSurface = dynamic(
  () => import("./agent-surfaces/cloud-agent-surface").then((module) => module.CloudAgentSurface),
  {
    ssr: false,
    loading: () => <ChatLoadingState label="Loading OpenUI Cloud…" />,
  },
);

interface CloudSurfaceErrorBoundaryProps {
  children: ReactNode;
}

class CloudSurfaceErrorBoundary extends Component<
  CloudSurfaceErrorBoundaryProps,
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return <CloudUnavailableState />;
    return this.props.children;
  }
}

export function ChatPageClient() {
  const { resolvedTheme } = useTheme();
  const [mode, setMode] = useState<ChatMode>("oss");
  const [announcement, setAnnouncement] = useState("");
  const [creditsDialogOpen, setCreditsDialogOpen] = useState(false);
  const themeMode = resolvedTheme === "dark" ? "dark" : "light";

  const handleCreditsExhausted = useCallback(() => {
    setCreditsDialogOpen(true);
  }, []);

  const requestModeChange = useCallback(
    (nextMode: ChatMode) => {
      if (nextMode === mode) return;

      setMode(nextMode);
      setAnnouncement(
        `${nextMode === "oss" ? "OpenUI OSS" : "OpenUI Cloud"} mode selected. New chat started.`,
      );
    },
    [mode],
  );

  return (
    <main className={styles.page}>
      <h1 className={styles.srOnly}>OpenUI Chat</h1>
      <ChatPageHeader mode={mode} onModeChange={requestModeChange} />

      <section
        className={styles.agentViewport}
        aria-label={`${mode === "oss" ? "OpenUI OSS" : "OpenUI Cloud"} chat`}
      >
        {mode === "oss" ? (
          <OssAgentSurface themeMode={themeMode} onCreditsExhausted={handleCreditsExhausted} />
        ) : (
          <CloudSurfaceErrorBoundary>
            <CloudAgentSurface themeMode={themeMode} />
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
