import type { AssistantMessage, Message } from "@openuidev/react-headless";
import { MessageProvider, useThread, useToolActivities } from "@openuidev/react-headless";
import clsx from "clsx";
import React, { memo, useRef } from "react";
import { ScrollVariant, useScrollToBottom } from "../../hooks/useScrollToBottom";
import { DetailedViewOverlay } from "../_shared/detailed-view";
import { useShellStore } from "../_shared/store";
import { TimelineEntry } from "../_shared/tool-renderer";
import type { AssistantMessageComponent, UserMessageComponent } from "../_shared/types";
import { MarkDownRenderer } from "../MarkDownRenderer";
import { MessageLoading as MessageLoadingComponent } from "../MessageLoading";

export const ThreadContainer = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  const isLoadingMessages = useThread((s) => s.isLoadingMessages);

  return (
    <div
      className={clsx("openui-copilot-shell-thread-container", className)}
      style={{
        visibility: isLoadingMessages ? "hidden" : undefined,
      }}
    >
      {children}
      <DetailedViewOverlay />
    </div>
  );
};

export const ScrollArea = ({
  children,
  className,
  scrollVariant = "user-message-anchor",
  userMessageSelector = ".openui-copilot-shell-thread-message-user",
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
    <div className="openui-copilot-shell-thread-scroll-container">
      <div
        ref={ref}
        className={clsx(
          "openui-copilot-shell-thread-scroll-area",
          {
            "openui-copilot-shell-thread-scroll-area--user-message-anchor":
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
  const { logoUrl, showAssistantLogo } = useShellStore((store) => ({
    logoUrl: store.logoUrl,
    showAssistantLogo: store.showAssistantLogo,
  }));

  return (
    <div className={clsx("openui-copilot-shell-thread-message-assistant", className)}>
      {showAssistantLogo && (
        <img
          src={logoUrl}
          alt="Assistant"
          className="openui-copilot-shell-thread-message-assistant__logo"
        />
      )}
      <div className="openui-copilot-shell-thread-message-assistant__content">{children}</div>
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
    <div className={clsx("openui-copilot-shell-thread-message-user", className)}>
      <div className="openui-copilot-shell-thread-message-user__content">{children}</div>
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
  const activities = useToolActivities(message, allMessages);

  return (
    <>
      {message.content && (
        <MarkDownRenderer
          textMarkdown={message.content}
          className="openui-copilot-shell-thread-message-assistant__text"
        />
      )}
      {activities.map((activity, idx) => (
        <TimelineEntry
          key={activity.id}
          activity={activity}
          isLast={isLast && idx === activities.length - 1}
        />
      ))}
    </>
  );
};

const UserMessageContent = ({ message }: { message: Message }) => {
  if (message.role !== "user") return null;
  const content = message.content;
  if (typeof content === "string") {
    return <>{content}</>;
  }
  return (
    <>
      {content?.map((part, i) => {
        if (part.type === "text") {
          return <span key={i}>{part.text}</span>;
        }
        if (part.type === "binary" && part.url) {
          return (
            <img
              key={i}
              src={part.url}
              alt=""
              className="openui-copilot-shell-thread-message-user__image"
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

    return null;
  },
);

export const MessageLoading = () => {
  return (
    <div className="openui-copilot-shell-thread-message-loading">
      <MessageLoadingComponent />
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

  let lastAssistantIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === "assistant") {
      lastAssistantIndex = i;
      break;
    }
  }

  return (
    <div className={clsx("openui-copilot-shell-thread-messages", className)}>
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
    </div>
  );
};

// Re-export Composer from components
export { Composer } from "./components";
