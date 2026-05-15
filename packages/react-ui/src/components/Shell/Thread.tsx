import type { AssistantMessage, Message, ToolMessage } from "@openuidev/react-headless";
import { MessageProvider, useActiveDetailedView, useThread } from "@openuidev/react-headless";
import clsx from "clsx";
import React, { memo, useRef } from "react";
import { useLayoutContext } from "../../context/LayoutContext";
import { ScrollVariant, useScrollToBottom } from "../../hooks/useScrollToBottom";
import { separateContentAndContext } from "../../utils/contentParser";
import { DetailedViewOverlay, DetailedViewPortalTarget } from "../_shared/detailed-view";
import { useShellStore } from "../_shared/store";
import { ToolMessageRenderer } from "../_shared/tool-renderer";
import type { AssistantMessageComponent, UserMessageComponent } from "../_shared/types";
import { Callout } from "../Callout";
import { MarkDownRenderer } from "../MarkDownRenderer";
import { MessageLoading as MessageLoadingComponent } from "../MessageLoading";
import { BehindTheScenes, deriveThinkItems } from "../ToolCall";
import { ResizableSeparator } from "./ResizableSeparator";
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

  const { setIsSidebarOpen } = useShellStore((state) => ({
    setIsSidebarOpen: state.setIsSidebarOpen,
  }));

  const isLoadingMessages = useThread((s) => s.isLoadingMessages);

  const {
    containerRef,
    chatPanelRef,
    detailedViewPanelRef,
    isDragging,
    handleResize,
    handleDragStart,
    handleDragEnd,
  } = useDetailedViewResize({
    isDetailedViewActive,
    isMobile,
    setIsSidebarOpen,
  });

  return (
    <div
      className={clsx("openui-shell-thread-container", className, {
        "openui-shell-thread-container--detailed-view-active": isDetailedViewActive,
      })}
      style={{
        visibility: isLoadingMessages ? "hidden" : undefined,
      }}
    >
      <div className="openui-shell-thread-wrapper" ref={containerRef}>
        {/* Chat panel - always visible */}
        <div
          ref={chatPanelRef}
          className={clsx("openui-shell-thread-chat-panel", {
            "openui-shell-thread-chat-panel--animating": !isDragging,
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
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
            <div
              ref={detailedViewPanelRef}
              className={clsx("openui-shell-thread-detailed-view-panel", {
                "openui-shell-thread-detailed-view-panel--animating": !isDragging,
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
  userMessageSelector,
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
  });

  return (
    <div className="openui-shell-thread-scroll-container">
      <div
        ref={ref}
        className={clsx(
          "openui-shell-thread-scroll-area",
          {
            "openui-shell-thread-scroll-area--user-message-anchor":
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
  const { logoUrl } = useShellStore((store) => ({
    logoUrl: store.logoUrl,
  }));

  return (
    <div className={clsx("openui-shell-thread-message-assistant", className)}>
      <img src={logoUrl} alt="Assistant" className="openui-shell-thread-message-assistant__logo" />
      <div className="openui-shell-thread-message-assistant__content">{children}</div>
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
    <div className={clsx("openui-shell-thread-message-user", className)}>
      <div className="openui-shell-thread-message-user__content">{children}</div>
    </div>
  );
};

const AssistantMessageContent = ({
  message,
  allMessages,
  isStreaming = false,
}: {
  message: AssistantMessage;
  allMessages: Message[];
  isStreaming?: boolean;
}) => {
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

  const thinkItems = React.useMemo(
    () => deriveThinkItems(message.toolCalls ?? [], toolMessages),
    [message.toolCalls, toolMessages],
  );

  return (
    <>
      {thinkItems.length > 0 && (
        <BehindTheScenes items={thinkItems} isThinking={isStreaming && !message.content} />
      )}
      {message.content && (
        <MarkDownRenderer
          textMarkdown={message.content}
          className="openui-shell-thread-message-assistant__text"
        />
      )}
      {toolMessages.map((tm) => {
        const toolCall = message.toolCalls?.find((tc) => tc.id === tm.toolCallId);
        if (!toolCall) return null;
        return (
          <ToolMessageRenderer key={tm.id} toolMessage={tm} toolCall={toolCall} fallback={null} />
        );
      })}
    </>
  );
};

const UserMessageContent = ({ message }: { message: Message }) => {
  if (message.role !== "user") return null;
  const content = message.content;
  if (typeof content === "string") {
    // Strip XML wrapper tags (<content>, <context>) so the bubble shows clean text
    const { content: humanText } = separateContentAndContext(content);
    return <>{humanText}</>;
  }
  // InputContent[] — render text parts
  return (
    <>
      {content?.map((part, i) => {
        if (part.type === "text") {
          return <span key={i}>{part.text}</span>;
        }
        // Binary content — could be image, file, etc.
        if (part.type === "binary" && part.url) {
          return (
            <img
              key={i}
              src={part.url}
              alt=""
              className="openui-shell-thread-message-user__image"
            />
          );
        }
        return null;
      })}
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
          <AssistantMessageContent
            message={message}
            allMessages={allMessages}
            isStreaming={isStreaming}
          />
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
    <div className="openui-shell-thread-message-loading">
      <MessageLoadingComponent />
    </div>
  );
};

export const ThreadError = () => {
  const threadError = useThread((s) => s.threadError);
  if (!threadError) return null;

  return (
    <div className="openui-shell-thread-error">
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
    <div className={clsx("openui-shell-thread-messages", className)}>
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
  return <div className={clsx("openui-shell-thread-header", className)}>{children}</div>;
};

// Re-export Composer from components
export { Composer } from "./components";
