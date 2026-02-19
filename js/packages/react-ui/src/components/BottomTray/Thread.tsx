import {
  Message,
  MessageProvider,
  useThreadManagerSelector,
  useThreadState,
} from "@crayonai/react-core";
import clsx from "clsx";
import React, { memo, useEffect, useRef } from "react";
import { ScrollVariant, useScrollToBottom } from "../../hooks/useScrollToBottom";
import { MessageLoading as MessageLoadingComponent } from "../MessageLoading";
import { useShellStore } from "../Shell/store";

export const ThreadContainer = ({
  children,
  className,
  isArtifactActive = false,
  renderArtifact = () => null,
}: {
  children?: React.ReactNode;
  className?: string;
  isArtifactActive?: boolean;
  renderArtifact?: () => React.ReactNode;
}) => {
  const { setIsArtifactActive, setArtifactRenderer } = useShellStore((state) => ({
    setIsArtifactActive: state.setIsArtifactActive,
    setArtifactRenderer: state.setArtifactRenderer,
  }));

  useEffect(() => {
    setIsArtifactActive(isArtifactActive);
    setArtifactRenderer(renderArtifact);
  }, [isArtifactActive, renderArtifact, setIsArtifactActive, setArtifactRenderer]);

  const { isInitialized } = useThreadManagerSelector((store) => ({
    isInitialized: store.isInitialized,
  }));

  return (
    <div
      className={clsx("crayon-bottom-tray-thread-container", className)}
      style={{
        visibility: isInitialized ? undefined : "hidden",
      }}
    >
      {children}
    </div>
  );
};

export const ScrollArea = ({
  children,
  className,
  scrollVariant = "user-message-anchor",
  userMessageSelector = ".crayon-bottom-tray-thread-message-user",
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

  const { messages, isRunning, isLoadingMessages } = useThreadState();
  const { isArtifactActive, artifactRenderer } = useShellStore((store) => ({
    isArtifactActive: store.isArtifactActive,
    artifactRenderer: store.artifactRenderer,
  }));

  useScrollToBottom({
    ref,
    lastMessage: messages[messages.length - 1] || { id: "" },
    scrollVariant,
    userMessageSelector,
    isRunning,
    isLoadingMessages,
  });

  return (
    <div className="crayon-bottom-tray-thread-scroll-container">
      <div
        ref={ref}
        className={clsx(
          "crayon-bottom-tray-thread-scroll-area",
          {
            "crayon-bottom-tray-thread-scroll-area--user-message-anchor":
              scrollVariant === "user-message-anchor",
          },
          className,
        )}
      >
        {children}
      </div>
      {/* Gradient to hide the bottom of the scroll area */}
      <div className="crayon-bottom-tray-thread-scroll-gradient" />
      {isArtifactActive && (
        <div className="crayon-bottom-tray-thread-artifact-panel--mobile">{artifactRenderer()}</div>
      )}
    </div>
  );
};

const FallbackTemplate = ({ name, templateProps }: { name: string; templateProps: any }) => {
  return (
    <div>
      Unable to render template: {name} with props:
      {JSON.stringify(templateProps)}
    </div>
  );
};

const DefaultTextRenderer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={className}>{children}</div>;
};

export const AssistantMessageContainer = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={clsx("crayon-bottom-tray-thread-message-assistant", className)}>
      <div className="crayon-bottom-tray-thread-message-assistant__content">{children}</div>
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
    <div className={clsx("crayon-bottom-tray-thread-message-user", className)}>
      <div className="crayon-bottom-tray-thread-message-user__content">{children}</div>
    </div>
  );
};

export const RenderMessage = memo(
  ({ message, className }: { message: Message; className?: string }) => {
    const responseTemplates = useThreadManagerSelector((store) => store.responseTemplates);
    const MessageContainer =
      message.role === "user" ? UserMessageContainer : AssistantMessageContainer;

    if (message.role === "assistant") {
      return (
        <MessageContainer className={className}>
          {message.message?.map((stringOrTemplate, i) => {
            if (stringOrTemplate.type === "text") {
              const TextRenderer = responseTemplates["text"]?.Component || DefaultTextRenderer;

              return (
                <TextRenderer key={i} className="crayon-bottom-tray-thread-message-assistant__text">
                  {stringOrTemplate.text}
                </TextRenderer>
              );
            }

            const Template = responseTemplates[stringOrTemplate.name];
            const Fallback = responseTemplates["fallback"]?.Component || FallbackTemplate;
            return Template ? (
              <Template.Component key={i} {...stringOrTemplate.templateProps} />
            ) : (
              <Fallback
                key={i}
                name={stringOrTemplate.name}
                templateProps={stringOrTemplate.templateProps}
              />
            );
          })}
        </MessageContainer>
      );
    }

    return <MessageContainer>{message.message}</MessageContainer>;
  },
);

export const MessageLoading = () => {
  return (
    <div className="crayon-bottom-tray-thread-message-loading">
      <MessageLoadingComponent />
    </div>
  );
};

export const Messages = ({
  className,
  loader,
}: {
  className?: string;
  loader?: React.ReactNode;
}) => {
  const { messages, isRunning } = useThreadState();

  return (
    <div className={clsx("crayon-bottom-tray-thread-messages", className)}>
      {messages.map((message) => {
        if (message.isVisuallyHidden) {
          return null;
        }
        return (
          <MessageProvider key={message.id} message={message}>
            <RenderMessage message={message} />
          </MessageProvider>
        );
      })}
      {isRunning && <div>{loader}</div>}
    </div>
  );
};

// Re-export Composer from components
export { Composer } from "./components";
