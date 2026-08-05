"use client";

import { useThreadList } from "@openuidev/react-headless";
import { AgentInterface } from "@openuidev/react-ui";
import { useEffect, useRef, useState } from "react";
import styles from "../chat-page.module.css";
import { CloudModelSwitcher } from "./agent-surfaces/cloud-model-switcher";
import {
  getDemoConversation,
  getDemoFirstUserMessage,
  type DemoConversation,
} from "./demo-conversations";
import type { DemoForkRegistry } from "./demo-fork-registry";

interface DemoAwareModelSwitcherProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function DemoAwareModelSwitcher({
  selectedModel,
  onModelChange,
}: DemoAwareModelSwitcherProps) {
  const selectedThreadId = useThreadList((state) => state.selectedThreadId);
  const isDemo = getDemoConversation(selectedThreadId) !== undefined;

  return (
    <CloudModelSwitcher
      selectedModel={selectedModel}
      onModelChange={onModelChange}
      disabled={isDemo}
    />
  );
}

interface DemoAwareComposerProps {
  forkRegistry: DemoForkRegistry;
  onNavigate: (path: string | undefined) => void;
}

export function DemoAwareComposer({ forkRegistry, onNavigate }: DemoAwareComposerProps) {
  const selectedThreadId = useThreadList((state) => state.selectedThreadId);
  const demo = getDemoConversation(selectedThreadId);

  if (!demo) return <AgentInterface.Composer />;

  return (
    <ReadOnlyDemoComposer
      key={demo.id}
      demo={demo}
      forkRegistry={forkRegistry}
      onNavigate={onNavigate}
    />
  );
}

/**
 * Keep recorded GenUI responses inert without disabling artifact previews or
 * the explicit continuation CTA. The published renderer does not expose a
 * read-only prop, so mark only its direct response roots while a fixture thread
 * is selected. Private continuations immediately regain normal interactivity.
 */
export function DemoResponseInteractionGuard() {
  const selectedThreadId = useThreadList((state) => state.selectedThreadId);
  const isDemo = getDemoConversation(selectedThreadId) !== undefined;
  const markerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const surface = markerRef.current?.closest(".chat-agent-surface");
    if (!(surface instanceof HTMLElement)) return;

    const markedRoots = new Set<HTMLElement>();
    const clearMarkedRoots = () => {
      for (const root of markedRoots) {
        root.removeAttribute("inert");
        root.removeAttribute("aria-disabled");
        root.removeAttribute("data-openui-demo-readonly-renderer");
      }
      markedRoots.clear();
    };
    const markResponseRoots = () => {
      clearMarkedRoots();
      if (!isDemo) return;

      for (const content of surface.querySelectorAll(
        ".openui-shell-thread-message-assistant__content",
      )) {
        const root = content.lastElementChild;
        if (!(root instanceof HTMLElement) || root.style.position !== "relative") continue;

        root.setAttribute("inert", "");
        root.setAttribute("aria-disabled", "true");
        root.setAttribute("data-openui-demo-readonly-renderer", "true");
        markedRoots.add(root);
      }
    };

    markResponseRoots();
    const observer = new MutationObserver(markResponseRoots);
    observer.observe(surface, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      clearMarkedRoots();
    };
  }, [isDemo]);

  return <span ref={markerRef} className={styles.demoReadOnlyMarker} aria-hidden="true" />;
}

interface ReadOnlyDemoComposerProps {
  demo: DemoConversation;
  forkRegistry: DemoForkRegistry;
  onNavigate: (path: string | undefined) => void;
}

function ReadOnlyDemoComposer({ demo, forkRegistry, onNavigate }: ReadOnlyDemoComposerProps) {
  const createThread = useThreadList((state) => state.createThread);
  const updateThread = useThreadList((state) => state.updateThread);
  const selectThread = useThreadList((state) => state.selectThread);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const continueInNewChat = async () => {
    if (isCreating) return;
    setIsCreating(true);
    setError("");

    try {
      const firstMessage = getDemoFirstUserMessage(demo);
      const thread = await createThread({ ...firstMessage, id: crypto.randomUUID() });
      const continuation = { ...thread, title: `${demo.title} continuation` };
      forkRegistry.register(thread.id, demo.id);
      updateThread(continuation);
      selectThread(thread.id);
      onNavigate(undefined);
    } catch {
      setError("Could not create a continuation. Please try again.");
      setIsCreating(false);
    }
  };

  return (
    <div className={styles.demoComposerState}>
      <button
        type="button"
        className={styles.demoComposerCta}
        onClick={continueInNewChat}
        disabled={isCreating}
      >
        {isCreating ? "Creating chat…" : "Continue conversation"}
      </button>
      {error && (
        <p className={styles.demoComposerError} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface DemoPathSynchronizerProps {
  path: string | undefined;
  onNavigate: (path: string | undefined) => void;
}

export function DemoPathSynchronizer({ path, onNavigate }: DemoPathSynchronizerProps) {
  const selectedThreadId = useThreadList((state) => state.selectedThreadId);

  useEffect(() => {
    if (path?.startsWith("demo/") && !getDemoConversation(selectedThreadId)) {
      onNavigate(undefined);
    }
  }, [onNavigate, path, selectedThreadId]);

  return null;
}
