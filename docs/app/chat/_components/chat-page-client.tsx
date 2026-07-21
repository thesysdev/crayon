"use client";

import { DemoCreditsDialog } from "@/components/DemoCreditsDialog";
import { OPENUI_CLOUD_UNAVAILABLE_MESSAGE } from "@/lib/openui-cloud/errors";
import type { GenUIConversationAction } from "@openuidev/react-ui";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import styles from "../chat-page.module.css";
import { MarkdownAgentSurface } from "./agent-surfaces/markdown-agent-surface";
import { OssAgentSurface } from "./agent-surfaces/oss-agent-surface";
import { ChatPageHeader } from "./chat-page-header";
import { COMPARISON_MODE_LABELS, getComparisonPair, type ComparisonPair } from "./chat-types";
import { ComparisonControls } from "./comparison-controls";
import type {
  ComparisonMode,
  ComparisonModeController,
  ComparisonModeSnapshot,
} from "./comparison-mode-controller";
import {
  createComparisonControllerRegistry,
  useComparisonModeSnapshot,
} from "./comparison-mode-controller";

const ALL_MODES = ["markdown", "oss", "cloud"] as const;

const CloudAgentSurface = dynamic(
  () => import("./agent-surfaces/cloud-agent-surface").then((module) => module.CloudAgentSurface),
  {
    ssr: false,
    loading: () => <ChatLoadingState label="Loading OpenUI Cloud…" />,
  },
);

interface SurfaceErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage: string;
  onError?: () => void;
}

class SurfaceErrorBoundary extends Component<SurfaceErrorBoundaryProps, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      return <SurfaceUnavailableState message={this.props.fallbackMessage} />;
    }
    return this.props.children;
  }
}

export function ChatPageClient() {
  const { resolvedTheme } = useTheme();
  const [pair, setPair] = useState<ComparisonPair>("markdown-oss");
  const selectedPair = getComparisonPair(pair);
  const [mobileMode, setMobileMode] = useState<(typeof ALL_MODES)[number]>(selectedPair.modes[0]);
  const [isCompact, setIsCompact] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [creditsDialogOpen, setCreditsDialogOpen] = useState(false);
  const [unavailableModes, setUnavailableModes] = useState<Set<ComparisonMode>>(() => new Set());
  const [registry] = useState(createComparisonControllerRegistry);
  const themeMode = resolvedTheme === "dark" ? "dark" : "light";

  const markdown = useComparisonModeSnapshot(registry, "markdown");
  const oss = useComparisonModeSnapshot(registry, "oss");
  const cloud = useComparisonModeSnapshot(registry, "cloud");
  const snapshots = { markdown, oss, cloud } as const;
  const availableModeCount = ALL_MODES.length - unavailableModes.size;
  const allReady =
    availableModeCount > 0 &&
    ALL_MODES.every((mode) => unavailableModes.has(mode) || snapshots[mode].isReady);
  const anyRunning = ALL_MODES.some((mode) => snapshots[mode].isRunning);
  const hasStarted = ALL_MODES.some((mode) => snapshots[mode].messageCount > 0);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const update = () => setIsCompact(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const handleCreditsExhausted = useCallback(() => {
    setCreditsDialogOpen(true);
  }, [setCreditsDialogOpen]);

  const markModeUnavailable = useCallback(
    (mode: ComparisonMode) => {
      setUnavailableModes((current) => {
        if (current.has(mode)) return current;
        const next = new Set(current);
        next.add(mode);
        return next;
      });
    },
    [setUnavailableModes],
  );

  const getRegisteredControllers = useCallback(
    () =>
      ALL_MODES.map((mode) => registry.getController(mode)).filter(
        (controller): controller is ComparisonModeController => controller !== null,
      ),
    [registry],
  );

  const getReadyControllers = useCallback(() => {
    const controllers: ComparisonModeController[] = [];
    for (const mode of ALL_MODES) {
      if (unavailableModes.has(mode)) continue;
      const controller = registry.getController(mode);
      if (!controller) return null;
      controllers.push(controller);
    }
    return controllers.length > 0 ? controllers : null;
  }, [registry, unavailableModes]);

  const submitToAll = useCallback(
    (content: string) => {
      const controllers = getReadyControllers();
      if (!controllers) return;
      const states = controllers.map((controller) => controller.getSnapshot());
      if (states.some((state) => !state.isReady || state.isRunning)) return;

      void Promise.allSettled(controllers.map((controller) => controller.send(content)));
    },
    [getReadyControllers],
  );

  const stopAll = useCallback(() => {
    const controllers = getRegisteredControllers();
    if (controllers.length === 0) return;
    controllers.forEach((controller) => controller.cancel());
    setAnnouncement("Stopped all comparison responses.");
  }, [getRegisteredControllers, setAnnouncement]);

  const handleConversationAction = useCallback(
    (action: GenUIConversationAction) => submitToAll(action.content),
    [submitToAll],
  );

  const resetAll = useCallback(() => {
    const controllers = getRegisteredControllers();
    if (controllers.length === 0) return;
    controllers.forEach((controller) => controller.reset());
    setAnnouncement("All comparison conversations were reset.");
  }, [getRegisteredControllers, setAnnouncement]);

  const requestPairChange = useCallback(
    (nextPair: ComparisonPair) => {
      const next = getComparisonPair(nextPair);
      setPair(nextPair);
      setMobileMode((current) => (next.modes.includes(current) ? current : next.modes[0]));
      setAnnouncement(`${next.label} selected. Existing conversations were preserved.`);
    },
    [setAnnouncement, setMobileMode, setPair],
  );

  const selectAdjacentMobileMode = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const nextMode =
      mobileMode === selectedPair.modes[0] ? selectedPair.modes[1] : selectedPair.modes[0];
    setMobileMode(nextMode);
    requestAnimationFrame(() => document.getElementById(`comparison-tab-${nextMode}`)?.focus());
  };

  return (
    <main className={styles.page}>
      <h1 className={styles.srOnly}>Compare OpenUI response modes</h1>
      <ChatPageHeader pair={pair} onPairChange={requestPairChange} />

      <div className={styles.comparisonViewport}>
        <div
          className={styles.mobilePanelTabs}
          role="tablist"
          aria-label="Visible comparison panel"
        >
          {selectedPair.modes.map((mode) => (
            <button
              key={mode}
              id={`comparison-tab-${mode}`}
              type="button"
              role="tab"
              className={styles.mobilePanelTab}
              aria-selected={mobileMode === mode}
              aria-controls={`comparison-panel-${mode}`}
              tabIndex={mobileMode === mode ? 0 : -1}
              onClick={() => setMobileMode(mode)}
              onKeyDown={selectAdjacentMobileMode}
            >
              {COMPARISON_MODE_LABELS[mode]}
              <ModeStatusDot snapshot={snapshots[mode]} unavailable={unavailableModes.has(mode)} />
            </button>
          ))}
        </div>

        <div className={styles.panelGrid}>
          {ALL_MODES.map((mode) => {
            const position = selectedPair.modes.indexOf(mode);
            const inPair = position !== -1;
            const visible = inPair && (!isCompact || mobileMode === mode);
            const snapshot = snapshots[mode];

            return (
              <section
                key={mode}
                id={`comparison-panel-${mode}`}
                role={isCompact ? "tabpanel" : undefined}
                aria-labelledby={isCompact ? `comparison-tab-${mode}` : `panel-heading-${mode}`}
                aria-busy={snapshot.isRunning}
                className={styles.modePanel}
                hidden={!visible}
                data-position={position === 1 ? "second" : "first"}
                style={{ "--comparison-panel-order": Math.max(0, position) } as CSSProperties}
              >
                <header className={styles.panelHeader}>
                  <h2 id={`panel-heading-${mode}`}>{COMPARISON_MODE_LABELS[mode]}</h2>
                  <ModeStatus snapshot={snapshot} unavailable={unavailableModes.has(mode)} />
                </header>
                <div className={styles.panelBody}>
                  <SurfaceErrorBoundary
                    onError={() => markModeUnavailable(mode)}
                    fallbackMessage={
                      mode === "cloud"
                        ? OPENUI_CLOUD_UNAVAILABLE_MESSAGE
                        : `${COMPARISON_MODE_LABELS[mode]} could not be rendered.`
                    }
                  >
                    {mode === "markdown" && (
                      <MarkdownAgentSurface
                        themeMode={themeMode}
                        onCreditsExhausted={handleCreditsExhausted}
                        registry={registry}
                      />
                    )}
                    {mode === "oss" && (
                      <OssAgentSurface
                        themeMode={themeMode}
                        onCreditsExhausted={handleCreditsExhausted}
                        registry={registry}
                        onConversationAction={handleConversationAction}
                      />
                    )}
                    {mode === "cloud" && (
                      <CloudAgentSurface
                        themeMode={themeMode}
                        registry={registry}
                        onConversationAction={handleConversationAction}
                      />
                    )}
                  </SurfaceErrorBoundary>
                </div>
              </section>
            );
          })}
        </div>

        <ComparisonControls
          isReady={allReady}
          isRunning={anyRunning}
          hasStarted={hasStarted}
          onSubmit={submitToAll}
          onStop={stopAll}
          onReset={resetAll}
          isDegraded={unavailableModes.size > 0}
        />
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {announcement}
      </p>
      <p className={styles.srOnly} aria-live="polite" aria-atomic="true">
        {ALL_MODES.map(
          (mode) =>
            `${COMPARISON_MODE_LABELS[mode]} ${getModeStatus(
              snapshots[mode],
              unavailableModes.has(mode),
            )}`,
        ).join(". ")}
      </p>

      <DemoCreditsDialog open={creditsDialogOpen} onClose={() => setCreditsDialogOpen(false)} />
    </main>
  );
}

function getModeStatus(snapshot: ComparisonModeSnapshot, unavailable = false) {
  if (unavailable || snapshot.threadError) return "error";
  if (!snapshot.isReady) return "loading";
  if (snapshot.isRunning) return "generating";
  return "ready";
}

function ModeStatus({
  snapshot,
  unavailable,
}: {
  snapshot: ComparisonModeSnapshot;
  unavailable: boolean;
}) {
  const status = getModeStatus(snapshot, unavailable);
  const label = `${status.charAt(0).toUpperCase()}${status.slice(1)}`;

  return (
    <span className={styles.panelStatus} data-status={status}>
      <span aria-hidden="true" />
      {label}
    </span>
  );
}

function ModeStatusDot({
  snapshot,
  unavailable,
}: {
  snapshot: ComparisonModeSnapshot;
  unavailable: boolean;
}) {
  const status = getModeStatus(snapshot, unavailable);
  return <span className={styles.mobilePanelStatus} data-status={status} aria-hidden="true" />;
}

function ChatLoadingState({ label }: { label: string }) {
  return (
    <div className={styles.centeredState} role="status">
      <span className={styles.loadingIndicator} aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

function SurfaceUnavailableState({ message }: { message: string }) {
  return (
    <div className={styles.centeredState} role="status">
      <p>{message}</p>
    </div>
  );
}
