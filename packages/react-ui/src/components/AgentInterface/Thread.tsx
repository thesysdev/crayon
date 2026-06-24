import type { AssistantMessage, Message, ToolMessage } from "@openuidev/react-headless";
import {
  MessageProvider,
  useActiveDetailedView,
  useArtifactList,
  useThread,
} from "@openuidev/react-headless";
import clsx from "clsx";
import React, { memo, useId, useRef } from "react";
import { useLayoutContext } from "../../context/LayoutContext";
import { ScrollVariant, useScrollToBottom } from "../../hooks/useScrollToBottom";
import { DetailedViewOverlay, DetailedViewPortalTarget } from "./_shared/detailed-view";
import { useAgentInterfaceStore } from "./_shared/store";
import { ToolMessageRenderer } from "./_shared/tool-renderer";
import type { AssistantMessageComponent, UserMessageComponent } from "./_shared/types";

import { Callout } from "../Callout";
import { IconButton } from "../IconButton";
import { MarkDownRenderer } from "../MarkDownRenderer";
import { MessageLoading as MessageLoadingComponent } from "../MessageLoading";
import { ToolCallComponent } from "../ToolCall";
import { ToolResult } from "../ToolResult";
import { ResizableSeparator } from "./ResizableSeparator";
import { UserMessageContent } from "./UserMessageContent";
import { AgentInterfaceTooltip } from "./_shared/AgentInterfaceTooltip";
import { GalleryHorizontalEndIcon } from "./_shared/GalleryHorizontalEndIcon";
import { useDetailedViewResize } from "./useDetailedViewResize";

export const ThreadContainer = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  const { layout } = useLayoutContext();
  const isMobile = layout === "mobile";
  const { isDetailedViewActive } = useActiveDetailedView();

  const { setIsSidebarOpen } = useAgentInterfaceStore((state) => ({
    setIsSidebarOpen: state.setIsSidebarOpen,
  }));

  const isLoadingMessages = useThread((s) => s.isLoadingMessages);

  const {
    containerRef,
    chatPanelRef,
    detailedViewPanelRef,
    isDragging,
    handleResize,
    handleResizeStep,
    handleDragStart,
    handleDragEnd,
    getResizeAria,
  } = useDetailedViewResize({
    isDetailedViewActive,
    isMobile,
    setIsSidebarOpen,
  });

  const chatPanelId = useId();
  const detailPanelId = useId();

  return (
    <div
      className={clsx("openui-agent-thread-container", className, {
        "openui-agent-thread-container--detailed-view-active": isDetailedViewActive,
      })}
      style={{
        visibility: isLoadingMessages ? "hidden" : undefined,
      }}
    >
      <div className="openui-agent-thread-wrapper" ref={containerRef}>
        {/* Chat panel - always visible */}
        <div
          ref={chatPanelRef}
          id={chatPanelId}
          className={clsx("openui-agent-thread-chat-panel", {
            "openui-agent-thread-chat-panel--animating": !isDragging,
          })}
        >
          {children}
          {isMobile && <DetailedViewOverlay />}
        </div>

        {/* Desktop only: Resizable separator and detailed-view panel */}
        {!isMobile && isDetailedViewActive && (
          <>
            <ResizableSeparator
              onResize={handleResize}
              onResizeStep={handleResizeStep}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              getAriaValues={getResizeAria}
              controlsId={`${chatPanelId} ${detailPanelId}`}
              ariaLabel="Resize chat panel"
            />
            <div
              ref={detailedViewPanelRef}
              id={detailPanelId}
              className={clsx("openui-agent-thread-detailed-view-panel", {
                "openui-agent-thread-detailed-view-panel--animating": !isDragging,
              })}
            >
              <DetailedViewPortalTarget />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const ScrollArea = ({
  children,
  className,
  scrollVariant = "user-message-anchor",
  userMessageSelector = ".openui-agent-thread-message-user",
  scrollOnLoad = true,
}: {
  children?: React.ReactNode;
  className?: string;
  /**
   * Scroll to bottom once the last message is added
   */
  scrollVariant?: ScrollVariant;
  /**
   * Selector for the user message
   */
  userMessageSelector?: string;
  /**
   * When false, do not auto-scroll on initial load / conversation switch
   * (auto-scroll then only happens while a response is generating).
   */
  scrollOnLoad?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const messages = useThread((s) => s.messages);
  const isRunning = useThread((s) => s.isRunning);
  const isLoadingMessages = useThread((s) => s.isLoadingMessages);

  useScrollToBottom({
    ref,
    lastMessage: messages[messages.length - 1] || { id: "" },
    scrollVariant,
    userMessageSelector,
    isRunning,
    isLoadingMessages,
    scrollOnLoad,
  });

  return (
    <div className="openui-agent-thread-scroll-container">
      <div
        ref={ref}
        className={clsx(
          "openui-agent-thread-scroll-area",
          {
            "openui-agent-thread-scroll-area--user-message-anchor":
              scrollVariant === "user-message-anchor",
          },
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
};

export const AssistantMessageContainer = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={clsx("openui-agent-thread-message-assistant", className)}>
      <div className="openui-agent-thread-message-assistant__content">{children}</div>
    </div>
  );
};

export const UserMessageContainer = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={clsx("openui-agent-thread-message-user", className)}>
      <div className="openui-agent-thread-message-user__content">{children}</div>
    </div>
  );
};

const AssistantMessageContent = ({
  message,
  allMessages,
}: {
  message: AssistantMessage;
  allMessages: Message[];
}) => {
  // Collect tool messages that follow this assistant message
  const toolMessages: ToolMessage[] = [];
  const msgIndex = allMessages.findIndex((m) => m.id === message.id);
  if (msgIndex !== -1) {
    for (let i = msgIndex + 1; i < allMessages.length; i++) {
      const m = allMessages[i];
      if (m && m.role === "tool") {
        toolMessages.push(m as ToolMessage);
      } else {
        break;
      }
    }
  }

  return (
    <>
      {message.content && (
        <MarkDownRenderer
          textMarkdown={message.content}
          className="openui-agent-thread-message-assistant__text"
        />
      )}
      {message.toolCalls?.map((toolCall) => {
        // Render each tool call ONCE, passing its matching tool-role ToolMessage
        // if one has arrived. While the call is still streaming (no ToolMessage
        // yet), a matched artifact renderer renders IN-FLIGHT from the tool-call
        // args — Option A streams the openui-lang program as the openui_artifact
        // tool-call args, so the morph builds before any result lands. A
        // non-artifact tool shows the default chip until its result arrives. The
        // SAME instance is reused across the streaming → settled transition (key
        // is the stable toolCall.id), avoiding a remount.
        const tm = toolMessages.find((m) => m.toolCallId === toolCall.id) ?? null;
        return (
          <ToolMessageRenderer
            key={toolCall.id}
            toolMessage={tm}
            toolCall={toolCall}
            fallback={
              tm ? (
                <ToolResult message={tm} toolName={toolCall.function.name} />
              ) : (
                <ToolCallComponent toolCall={toolCall} />
              )
            }
          />
        );
      })}
      {/* Orphan tool-role messages with no matching tool call (rare). */}
      {toolMessages
        .filter((tm) => !message.toolCalls?.some((tc) => tc.id === tm.toolCallId))
        .map((tm) => (
          <span key={tm.id}>
            <ToolResult message={tm} />
          </span>
        ))}
    </>
  );
};

export const RenderMessage = memo(
  ({
    message,
    className,
    allMessages,
    assistantMessage: CustomAssistantMessage,
    userMessage: CustomUserMessage,
    isStreaming,
  }: {
    message: Message;
    className?: string;
    allMessages: Message[];
    assistantMessage?: AssistantMessageComponent;
    userMessage?: UserMessageComponent;
    isStreaming: boolean;
  }) => {
    if (message.role === "tool") {
      // Tool messages are rendered inline with their parent assistant message
      return null;
    }

    if (message.role === "assistant") {
      if (CustomAssistantMessage) {
        return <CustomAssistantMessage message={message} isStreaming={isStreaming} />;
      }
      return (
        <AssistantMessageContainer className={className}>
          <AssistantMessageContent message={message} allMessages={allMessages} />
        </AssistantMessageContainer>
      );
    }

    if (message.role === "user") {
      if (CustomUserMessage) {
        return <CustomUserMessage message={message} />;
      }
      return (
        <UserMessageContainer className={className}>
          <UserMessageContent message={message} />
        </UserMessageContainer>
      );
    }

    // Other roles (system, developer, reasoning, activity) — skip by default
    return null;
  },
);

export const MessageLoading = () => {
  return (
    <div className="openui-agent-thread-message-loading">
      <MessageLoadingComponent />
    </div>
  );
};

export const ThreadError = () => {
  const threadError = useThread((s) => s.threadError);
  if (!threadError) return null;

  return (
    <div className="openui-agent-thread-error">
      <Callout
        variant="danger"
        title="Something went wrong"
        description={threadError.message || "An unexpected error occurred. Please try again."}
      />
    </div>
  );
};

export const Messages = ({
  className,
  loader,
  assistantMessage,
  userMessage,
}: {
  className?: string;
  loader?: React.ReactNode;
  assistantMessage?: AssistantMessageComponent;
  userMessage?: UserMessageComponent;
}) => {
  const messages = useThread((s) => s.messages);
  const isRunning = useThread((s) => s.isRunning);
  const threadError = useThread((s) => s.threadError);

  return (
    <div className={clsx("openui-agent-thread-messages", className)}>
      {messages.map((message, i) => {
        return (
          <MessageProvider key={message.id} message={message}>
            <RenderMessage
              message={message}
              allMessages={messages}
              assistantMessage={assistantMessage}
              userMessage={userMessage}
              isStreaming={isRunning && i === messages.length - 1}
            />
          </MessageProvider>
        );
      })}
      {isRunning && <div>{loader}</div>}
      {!isRunning && threadError && <ThreadError />}
    </div>
  );
};

export const ThreadHeader = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={clsx("openui-agent-thread-header", className)}>
      <div className="openui-agent-thread-header__title">{/* Thread title hidden for now. */}</div>
      <div className="openui-agent-thread-header__actions">
        {children}
        <WorkspaceToggleButton />
      </div>
    </div>
  );
};

const WorkspaceToggleButton = () => {
  const artifacts = useArtifactList();
  const { isDetailedViewActive } = useActiveDetailedView();
  const { isWorkspaceOpen, setIsWorkspaceOpen } = useAgentInterfaceStore((state) => ({
    isWorkspaceOpen: state.isWorkspaceOpen,
    setIsWorkspaceOpen: state.setIsWorkspaceOpen,
  }));
  const hasArtifacts = Object.keys(artifacts).length > 0;

  if (!hasArtifacts || isDetailedViewActive) return null;

  return (
    <AgentInterfaceTooltip content="Apps & Artifacts" side="left">
      <IconButton
        icon={<GalleryHorizontalEndIcon size="1em" />}
        onClick={() => {
          if (hasArtifacts) setIsWorkspaceOpen(!isWorkspaceOpen);
        }}
        size="small"
        variant="tertiary"
        aria-label={isWorkspaceOpen ? "Collapse workspace" : "Expand workspace"}
        className="openui-agent-thread-header__workspace-toggle-button"
      />
    </AgentInterfaceTooltip>
  );
};

// Re-export Composer from components
export { Composer } from "./components";
