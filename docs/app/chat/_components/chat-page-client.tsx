"use client";

import { OPENUI_CLOUD_UNAVAILABLE_MESSAGE } from "@/lib/openui-cloud/errors";
import dynamic from "next/dynamic";
import { Component, useState, type ReactNode } from "react";
import styles from "../chat-page.module.css";
import { ChatPageHeader } from "./chat-page-header";
import type { ViewportPreset } from "./viewport-presets";

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
  const [viewport, setViewport] = useState<ViewportPreset>("desktop");

  return (
    <main className={styles.page}>
      <h1 className={styles.srOnly}>OpenUI Cloud Chat</h1>
      <ChatPageHeader viewport={viewport} onViewportChange={setViewport} />

      <section
        className={styles.agentViewport}
        data-viewport={viewport}
        aria-label="OpenUI Cloud chat"
      >
        <div className={styles.agentFrame} data-viewport={viewport}>
          <CloudSurfaceErrorBoundary>
            <CloudAgentSurface />
          </CloudSurfaceErrorBoundary>
        </div>
      </section>
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
