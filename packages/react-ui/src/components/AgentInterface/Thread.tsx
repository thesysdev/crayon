import type { AssistantMessage, Message } from "@openuidev/react-headless";
import {
  MessageProvider,
  useActiveDetailedView,
  useArtifactList,
  useThread,
  useToolActivities,
} from "@openuidev/react-headless";
import clsx from "clsx";
import React, { memo, useId, useRef } from "react";
import { useLayoutContext } from "../../context/LayoutContext";
import { ScrollVariant, useScrollToBottom } from "../../hooks/useScrollToBottom";
import {
  DetailedViewOverlay,
  DetailedViewPanel,
  DetailedViewPortalTarget,
} from "./_shared/detailed-view";
import { useAgentInterfaceLabels } from "./_shared/labelsContext";
import { useAgentInterfaceStore } from "./_shared/store";
import { TimelineEntry } from "./_shared/tool-renderer";
import type { AssistantMessageComponent, UserMessageComponent } from "./_shared/types";

import { Callout } from "../Callout";
import { DotMatrixLoader } from "../DotMatrixLoader";
import { IconButton } from "../IconButton";
import { MarkDownRenderer } from "../MarkDownRenderer";
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
  userMessageSelector = ".openui-agent-thread-message-user, .openui-shell-thread-message-user",
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
  isLast,
}: {
  message: AssistantMessage;
  allMessages: Message[];
  isLast: boolean;
}) => {
  // One id-keyed pairing of calls↔results with real status — no positional break,
  // no grouped-not-paired flow, running state from the data.
  const activities = useToolActivities(message, allMessages);

  return (
    <>
      {message.content && (
        <MarkDownRenderer
          textMarkdown={message.content}
          className="openui-agent-thread-message-assistant__text"
        />
      )}
      {activities.map((activity, idx) => (
        <TimelineEntry
          key={activity.id}
          activity={activity}
          isLast={isLast && idx === activities.length - 1}
          detailedViewPanel={DetailedViewPanel}
        />
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
    isLast,
  }: {
    message: Message;
    className?: string;
    allMessages: Message[];
    assistantMessage?: AssistantMessageComponent;
    userMessage?: UserMessageComponent;
    isStreaming: boolean;
    /** Whether this is the last *assistant* message (drives the running shimmer). */
    isLast: boolean;
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
          <AssistantMessageContent message={message} allMessages={allMessages} isLast={isLast} />
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
      <DotMatrixLoader variant="compact" />
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

  // Scan for the last *assistant* message (not the last message index) so the
  // running shimmer survives trailing tool messages.
  let lastAssistantIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === "assistant") {
      lastAssistantIndex = i;
      break;
    }
  }

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
              isStreaming={isRunning && i === lastAssistantIndex}
              isLast={i === lastAssistantIndex}
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
  const { workspaceToggle } = useAgentInterfaceLabels();
  const { isWorkspaceOpen, setIsWorkspaceOpen } = useAgentInterfaceStore((state) => ({
    isWorkspaceOpen: state.isWorkspaceOpen,
    setIsWorkspaceOpen: state.setIsWorkspaceOpen,
  }));
  const hasArtifacts = Object.keys(artifacts).length > 0;

  if (!hasArtifacts || isDetailedViewActive) return null;

  return (
    <AgentInterfaceTooltip content={workspaceToggle} side="left">
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
