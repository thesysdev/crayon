"use client";

import { OPENUI_CLOUD_UNAVAILABLE_MESSAGE } from "@/lib/openui-cloud/errors";
import dynamic from "next/dynamic";
import { Component, useState, useSyncExternalStore, type ReactNode } from "react";
import styles from "../chat-page.module.css";
import { ChatPageHeader } from "./chat-page-header";
import type { ViewportPreset } from "./viewport-presets";

type HostViewport = "mobile" | "tablet" | "desktop";

const HOST_VIEWPORT_PRESETS: Record<HostViewport, readonly ViewportPreset[]> = {
  mobile: ["mobile"],
  tablet: ["mobile", "tablet"],
  desktop: ["mobile", "tablet", "desktop"],
};

function getHostViewport(): HostViewport {
  if (window.matchMedia("(max-width: 767px)").matches) return "mobile";
  if (window.matchMedia("(max-width: 1023px)").matches) return "tablet";
  return "desktop";
}

function getServerHostViewport(): HostViewport {
  return "desktop";
}

function subscribeToHostViewport(onStoreChange: () => void) {
  const mediaQueries = [
    window.matchMedia("(max-width: 767px)"),
    window.matchMedia("(max-width: 1023px)"),
  ];

  mediaQueries.forEach((mediaQuery) => mediaQuery.addEventListener("change", onStoreChange));
  return () => {
    mediaQueries.forEach((mediaQuery) => mediaQuery.removeEventListener("change", onStoreChange));
  };
}

function constrainViewport(viewport: ViewportPreset, hostViewport: HostViewport): ViewportPreset {
  if (hostViewport === "mobile") return "mobile";
  if (hostViewport === "tablet" && viewport === "desktop") return "tablet";
  return viewport;
}

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
  const [preferredViewport, setPreferredViewport] = useState<ViewportPreset>("desktop");
  const hostViewport = useSyncExternalStore(
    subscribeToHostViewport,
    getHostViewport,
    getServerHostViewport,
  );
  const availableViewports = HOST_VIEWPORT_PRESETS[hostViewport];
  const viewport = constrainViewport(preferredViewport, hostViewport);

  return (
    <main className={styles.page}>
      <h1 className={styles.srOnly}>OpenUI Cloud Chat</h1>
      <ChatPageHeader
        viewport={viewport}
        availableViewports={availableViewports}
        onViewportChange={setPreferredViewport}
      />

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
