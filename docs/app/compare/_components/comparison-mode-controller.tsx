"use client";

import { useThread, useThreadList } from "@openuidev/react-headless";
import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";

export type ComparisonMode = "markdown" | "oss" | "cloud";

/**
 * The live state a shared comparison composer needs from one AgentInterface.
 * `isReady` means that the mode is mounted and can accept a new user message.
 */
export interface ComparisonModeSnapshot {
  isReady: boolean;
  isRunning: boolean;
  isLoadingMessages: boolean;
  threadError: Error | null;
  messageCount: number;
}

export interface ComparisonModeController {
  readonly mode: ComparisonMode;
  send: (content: string) => Promise<void>;
  cancel: () => void;
  reset: () => void;
  getSnapshot: () => ComparisonModeSnapshot;
  subscribe: (listener: () => void) => () => void;
}

export interface ComparisonControllerRegistry {
  register: (mode: ComparisonMode, controller: ComparisonModeController) => () => void;
  getController: (mode: ComparisonMode) => ComparisonModeController | null;
  getSnapshot: (mode: ComparisonMode) => ComparisonModeSnapshot;
  subscribe: (mode: ComparisonMode, listener: () => void) => () => void;
}

export interface ComparisonModeControllerBridgeProps {
  mode: ComparisonMode;
  registry: ComparisonControllerRegistry;
}

const UNAVAILABLE_SNAPSHOT: ComparisonModeSnapshot = Object.freeze({
  isReady: false,
  isRunning: false,
  isLoadingMessages: false,
  threadError: null,
  messageCount: 0,
});

/**
 * Creates the registry shared by the comparison page and its three mounted
 * AgentInterface instances. Create this once (for example, with useState) so
 * registration is not repeated on every parent render.
 */
export function createComparisonControllerRegistry(): ComparisonControllerRegistry {
  const controllers = new Map<ComparisonMode, ComparisonModeController>();
  const snapshots = new Map<ComparisonMode, ComparisonModeSnapshot>();
  const controllerUnsubscribers = new Map<ComparisonMode, () => void>();
  const listeners = new Map<ComparisonMode, Set<() => void>>();

  const emit = (mode: ComparisonMode) => {
    listeners.get(mode)?.forEach((listener) => listener());
  };

  const unregisterCurrent = (mode: ComparisonMode, controller: ComparisonModeController) => {
    if (controllers.get(mode) !== controller) return;

    controllerUnsubscribers.get(mode)?.();
    controllerUnsubscribers.delete(mode);
    controllers.delete(mode);
    snapshots.delete(mode);
    emit(mode);
  };

  return {
    register(mode, controller) {
      const previousController = controllers.get(mode);
      if (previousController && previousController !== controller) {
        unregisterCurrent(mode, previousController);
      }

      controllers.set(mode, controller);
      snapshots.set(mode, controller.getSnapshot());

      if (previousController !== controller) {
        const unsubscribe = controller.subscribe(() => {
          if (controllers.get(mode) !== controller) return;

          const nextSnapshot = controller.getSnapshot();
          if (snapshots.get(mode) === nextSnapshot) return;

          snapshots.set(mode, nextSnapshot);
          emit(mode);
        });
        controllerUnsubscribers.set(mode, unsubscribe);
        emit(mode);
      }

      let isRegistered = true;
      return () => {
        if (!isRegistered) return;
        isRegistered = false;
        unregisterCurrent(mode, controller);
      };
    },

    getController(mode) {
      return controllers.get(mode) ?? null;
    },

    getSnapshot(mode) {
      return snapshots.get(mode) ?? UNAVAILABLE_SNAPSHOT;
    },

    subscribe(mode, listener) {
      const modeListeners = listeners.get(mode) ?? new Set<() => void>();
      modeListeners.add(listener);
      listeners.set(mode, modeListeners);

      return () => {
        modeListeners.delete(listener);
        if (modeListeners.size === 0) listeners.delete(mode);
      };
    },
  };
}

/** Subscribe a parent coordinator to one mode without mirroring state manually. */
export function useComparisonModeSnapshot(
  registry: ComparisonControllerRegistry,
  mode: ComparisonMode,
): ComparisonModeSnapshot {
  const subscribe = useCallback(
    (listener: () => void) => registry.subscribe(mode, listener),
    [mode, registry],
  );
  const getSnapshot = useCallback(() => registry.getSnapshot(mode), [mode, registry]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Invisible bridge between one AgentInterface store and the shared comparison
 * controls. Mount it as the child of that interface's AgentInterface.Composer.
 */
export function ComparisonModeControllerBridge({
  mode,
  registry,
}: ComparisonModeControllerBridgeProps) {
  const processMessage = useThread((state) => state.processMessage);
  const cancelMessage = useThread((state) => state.cancelMessage);
  const switchToNewThread = useThreadList((state) => state.switchToNewThread);
  const isRunning = useThread((state) => state.isRunning);
  const isLoadingMessages = useThread((state) => state.isLoadingMessages);
  const threadError = useThread((state) => state.threadError);
  const messageCount = useThread((state) => state.messages.length);

  const currentRef = useRef({
    processMessage,
    cancelMessage,
    switchToNewThread,
    isRunning,
    isLoadingMessages,
  });

  useEffect(() => {
    currentRef.current = {
      processMessage,
      cancelMessage,
      switchToNewThread,
      isRunning,
      isLoadingMessages,
    };
  }, [cancelMessage, isLoadingMessages, isRunning, processMessage, switchToNewThread]);

  const snapshot = useMemo<ComparisonModeSnapshot>(
    () => ({
      isReady: !isLoadingMessages,
      isRunning,
      isLoadingMessages,
      threadError,
      messageCount,
    }),
    [isLoadingMessages, isRunning, messageCount, threadError],
  );
  const snapshotRef = useRef(snapshot);
  const snapshotListenersRef = useRef(new Set<() => void>());

  const send = useCallback(async (content: string) => {
    const current = currentRef.current;
    if (!content.trim() || current.isRunning || current.isLoadingMessages) return;

    await current.processMessage({ role: "user", content });
  }, []);

  const cancel = useCallback(() => {
    currentRef.current.cancelMessage();
  }, []);

  const reset = useCallback(() => {
    // switchToNewThread cancels an active run before clearing the selected
    // thread and messages. Persisted storage records are intentionally kept.
    currentRef.current.switchToNewThread();
  }, []);

  const controller = useMemo<ComparisonModeController>(
    () => ({
      mode,
      send,
      cancel,
      reset,
      getSnapshot: () => snapshotRef.current,
      subscribe: (listener) => {
        snapshotListenersRef.current.add(listener);
        return () => snapshotListenersRef.current.delete(listener);
      },
    }),
    [cancel, mode, reset, send],
  );

  useEffect(() => {
    if (snapshotRef.current === snapshot) return;

    snapshotRef.current = snapshot;
    snapshotListenersRef.current.forEach((listener) => listener());
  }, [snapshot]);

  useEffect(() => registry.register(mode, controller), [controller, mode, registry]);

  return null;
}
