"use client";

import { useThread, useThreadList } from "@openuidev/react-headless";
import { useEffect, useLayoutEffect, useRef } from "react";
import type { ChatLifecycleState } from "../chat-types";

interface ChatLifecycleBridgeProps {
  onChange: (state: ChatLifecycleState) => void;
  onError?: () => void;
}

export function ChatLifecycleBridge({ onChange, onError }: ChatLifecycleBridgeProps) {
  const messages = useThread((state) => state.messages);
  const isRunning = useThread((state) => state.isRunning);
  const isLoadingMessages = useThread((state) => state.isLoadingMessages);
  const threadError = useThread((state) => state.threadError);
  const cancelMessage = useThread((state) => state.cancelMessage);
  const selectedThreadId = useThreadList((state) => state.selectedThreadId);
  const isLoadingThreads = useThreadList((state) => state.isLoadingThreads);
  const threadListError = useThreadList((state) => state.threadListError);
  const cancelMessageRef = useRef(cancelMessage);
  const hasConversation = messages.length > 0 || (selectedThreadId !== null && !isLoadingMessages);

  useEffect(() => {
    cancelMessageRef.current = cancelMessage;
  }, [cancelMessage]);

  useEffect(() => {
    onChange({
      hasConversation,
      isRunning,
      isLoading: isLoadingMessages || isLoadingThreads,
    });
  }, [hasConversation, isLoadingMessages, isLoadingThreads, isRunning, onChange]);

  useLayoutEffect(() => {
    if (threadError || threadListError) onError?.();
  }, [onError, threadError, threadListError]);

  useEffect(
    () => () => {
      cancelMessageRef.current();
    },
    [],
  );

  return null;
}
