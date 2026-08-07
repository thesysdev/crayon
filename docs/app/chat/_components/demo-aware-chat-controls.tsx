"use client";

import { CHAT_DEMO_EVENTS, captureChatDemoEvent, getChatDemoId } from "@/lib/chat-demo-analytics";
import { useThreadList } from "@openuidev/react-headless";
import { AgentInterface } from "@openuidev/react-ui";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "../chat-page.module.css";
import { CloudModelSwitcher } from "./agent-surfaces/cloud-model-switcher";
import {
  getDemoConversation,
  getDemoConversationBySlug,
  getDemoConversationPath,
  getDemoFirstUserMessage,
  type DemoConversation,
} from "./demo-conversations";
import type { DemoForkRegistry } from "./demo-fork-registry";
import { preserveCurrentUrlSearch } from "./viewport-presets";

interface DemoAwareModelSwitcherProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function DemoAwareModelSwitcher({
  selectedModel,
  onModelChange,
}: DemoAwareModelSwitcherProps) {
  const selectedThreadId = useThreadList((state) => state.selectedThreadId);
  const demo = getDemoConversation(selectedThreadId);
  const disabledReason = demo ? "This read-only demo uses a fixed recorded model." : undefined;

  return (
    <CloudModelSwitcher
      selectedModel={demo?.recordedModel ?? selectedModel}
      onModelChange={onModelChange}
      disabled={disabledReason !== undefined}
      disabledReason={disabledReason}
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
    const markedControls = new Map<
      HTMLElement,
      { ariaDisabled: string | null; inert: string | null; tabIndex: string | null }
    >();
    const clearMarkedRoots = () => {
      for (const [control, previous] of markedControls) {
        restoreAttribute(control, "aria-disabled", previous.ariaDisabled);
        restoreAttribute(control, "inert", previous.inert);
        restoreAttribute(control, "tabindex", previous.tabIndex);
      }
      markedControls.clear();

      for (const root of markedRoots) {
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

        root.setAttribute("data-openui-demo-readonly-renderer", "true");
        markedRoots.add(root);

        for (const control of root.querySelectorAll<HTMLElement>(READ_ONLY_CONTROL_SELECTOR)) {
          markedControls.set(control, {
            ariaDisabled: control.getAttribute("aria-disabled"),
            inert: control.getAttribute("inert"),
            tabIndex: control.getAttribute("tabindex"),
          });
          control.setAttribute("aria-disabled", "true");
          control.setAttribute("inert", "");
          control.setAttribute("tabindex", "-1");
        }
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

const READ_ONLY_CONTROL_SELECTOR =
  'a[href], button, input, textarea, select, [contenteditable="true"], [role="button"], [role="checkbox"], [role="combobox"], [role="link"], [role="menuitem"], [role="option"], [role="radio"], [role="slider"], [role="spinbutton"], [role="switch"], [role="tab"]';

function restoreAttribute(element: HTMLElement, name: string, value: string | null) {
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
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
      const demoId = getChatDemoId(demo.id);
      if (demoId) {
        captureChatDemoEvent(CHAT_DEMO_EVENTS.continuationCreate, { demo_id: demoId });
      }
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
        data-attribute-element="continue-conversation"
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

/**
 * Keep public demo URLs and the selected fixture thread in sync. Browser
 * navigation wins when the pathname changes; otherwise thread selection owns
 * the URL. Private continuations and ordinary chats intentionally use /chat.
 */
export function DemoRouteSynchronizer({
  onNavigate,
}: {
  onNavigate: (path: string | undefined) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const selectedThreadId = useThreadList((state) => state.selectedThreadId);
  const selectThread = useThreadList((state) => state.selectThread);
  const switchToNewThread = useThreadList((state) => state.switchToNewThread);
  const previousPathname = useRef(pathname);
  const previousThreadId = useRef(selectedThreadId);
  const isInitialized = useRef(false);
  const selectionDrivenPathnames = useRef(new Set<string>());
  const lastCapturedDemoId = useRef<string | undefined>(undefined);

  useEffect(() => {
    const pathnameChanged = previousPathname.current !== pathname;
    const threadChanged = previousThreadId.current !== selectedThreadId;
    previousPathname.current = pathname;
    previousThreadId.current = selectedThreadId;

    if (pathnameChanged && selectionDrivenPathnames.current.delete(pathname)) {
      return;
    }

    if (!isInitialized.current || pathnameChanged) {
      isInitialized.current = true;
      const routeDemo = getDemoConversationFromPathname(pathname);

      if (routeDemo && selectedThreadId !== routeDemo.id) {
        onNavigate(undefined);
        selectThread(routeDemo.id);
      } else if (pathname === "/chat" && selectedThreadId !== null) {
        switchToNewThread();
      }
      return;
    }

    if (!threadChanged) return;

    const selectedDemo = getDemoConversation(selectedThreadId);
    const nextPathname = selectedDemo ? getDemoConversationPath(selectedDemo) : "/chat";
    if (pathname !== nextPathname) {
      selectionDrivenPathnames.current.add(nextPathname);
      router.push(preserveCurrentUrlSearch(nextPathname));
    }
  }, [onNavigate, pathname, router, selectThread, selectedThreadId, switchToNewThread]);

  useEffect(() => {
    const demoId = getChatDemoId(getDemoConversation(selectedThreadId)?.id);
    if (!demoId) {
      lastCapturedDemoId.current = undefined;
      return;
    }
    if (lastCapturedDemoId.current === demoId) return;

    lastCapturedDemoId.current = demoId;
    captureChatDemoEvent(CHAT_DEMO_EVENTS.threadView, { demo_id: demoId });
  }, [selectedThreadId]);

  return null;
}

function getDemoConversationFromPathname(pathname: string): DemoConversation | undefined {
  const match = /^\/chat\/demo\/([^/]+)$/.exec(pathname);
  return match ? getDemoConversationBySlug(match[1]) : undefined;
}
