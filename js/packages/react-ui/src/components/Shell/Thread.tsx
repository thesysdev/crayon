import {
  Message,
  MessageProvider,
  useThreadManagerSelector,
  useThreadState,
} from "@crayonai/react-core";
import clsx from "clsx";
import React, { memo, useEffect, useRef } from "react";
import { useLayoutContext } from "../../context/LayoutContext";
import { ScrollVariant, useScrollToBottom } from "../../hooks/useScrollToBottom";
import { MessageLoading as MessageLoadingComponent } from "../MessageLoading";
import { ResizableSeparator } from "./ResizableSeparator";
import { useShellStore } from "./store";
import { useArtifactResize } from "./useArtifactResize";

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
  const { layout } = useLayoutContext();
  const isMobile = layout === "mobile";

  const { setIsSidebarOpen, setIsArtifactActive, setArtifactRenderer } = useShellStore((state) => ({
    setIsSidebarOpen: state.setIsSidebarOpen,
    setIsArtifactActive: state.setIsArtifactActive,
    setArtifactRenderer: state.setArtifactRenderer,
  }));

  // Sync artifact state and renderer with store
  useEffect(() => {
    setIsArtifactActive(isArtifactActive);
    setArtifactRenderer(renderArtifact);
  }, [isArtifactActive, renderArtifact, setIsArtifactActive, setArtifactRenderer]);

  const { isInitialized } = useThreadManagerSelector((store) => ({
    isInitialized: store.isInitialized,
  }));

  // Desktop-only: Handle resize logic for artifact panel
  const {
    containerRef,
    chatPanelRef,
    artifactPanelRef,
    isDragging,
    handleResize,
    handleDragStart,
    handleDragEnd,
  } = useArtifactResize({
    isArtifactActive,
    isMobile,
    setIsSidebarOpen,
  });

  return (
    <div
      className={clsx("crayon-shell-thread-container", className, {
        "crayon-shell-thread-container--artifact-active": isArtifactActive,
      })}
      style={{
        visibility: isInitialized ? undefined : "hidden",
      }}
    >
      <div className="crayon-shell-thread-wrapper" ref={containerRef}>
        {/* Chat panel - always visible */}
        <div
          ref={chatPanelRef}
          className={clsx("crayon-shell-thread-chat-panel", {
            "crayon-shell-thread-chat-panel--animating": !isDragging,
          })}
        >
          {children}
        </div>

        {/* Desktop only: Resizable separator and artifact panel */}
        {!isMobile && isArtifactActive && (
          <>
            <ResizableSeparator
              onResize={handleResize}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
            <div
              ref={artifactPanelRef}
              className={clsx("crayon-shell-thread-artifact-panel", {
                "crayon-shell-thread-artifact-panel--animating": !isDragging,
              })}
            >
              {renderArtifact?.()}
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
  const { layout } = useLayoutContext();
  const isMobile = layout === "mobile";

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
    <div className="crayon-shell-thread-scroll-container">
      <div
        ref={ref}
        className={clsx(
          "crayon-shell-thread-scroll-area",
          {
            "crayon-shell-thread-scroll-area--user-message-anchor":
              scrollVariant === "user-message-anchor",
          },
          className,
        )}
      >
        {children}
      </div>
      {isMobile && isArtifactActive && (
        <div className="crayon-shell-thread-artifact-panel--mobile">{artifactRenderer()}</div>
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
  const { logoUrl } = useShellStore((store) => ({
    logoUrl: store.logoUrl,
  }));

  return (
    <div className={clsx("crayon-shell-thread-message-assistant", className)}>
      <img src={logoUrl} alt="Assistant" className="crayon-shell-thread-message-assistant__logo" />
      <div className="crayon-shell-thread-message-assistant__content">{children}</div>
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
    <div className={clsx("crayon-shell-thread-message-user", className)}>
      <div className="crayon-shell-thread-message-user__content">{children}</div>
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
                <TextRenderer key={i} className="crayon-shell-thread-message-assistant__text">
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
    <div className="crayon-shell-thread-message-loading">
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
    <div className={clsx("crayon-shell-thread-messages", className)}>
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

export const ThreadHeader = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return <div className={clsx("crayon-shell-thread-header", className)}>{children}</div>;
};

// Re-export Composer from components
export { Composer } from "./components";
