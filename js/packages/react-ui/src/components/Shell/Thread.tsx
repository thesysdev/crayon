import {
  Message,
  MessageProvider,
  useThreadActions,
  useThreadManagerSelector,
  useThreadState,
} from "@crayonai/react-core";
import clsx from "clsx";
import { ArrowRight, Square } from "lucide-react";
import React, { memo, useLayoutEffect, useRef } from "react";
import { useComposerState } from "../../hooks/useComposerState";
import { useScrollToBottom } from "../../hooks/useScrollToBottom";
import { IconButton } from "../IconButton";
import { MessageLoading as MessageLoadingComponent } from "../MessageLoading";
import { useShellStore } from "./store";

export const ThreadContainer = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return <div className={clsx("crayon-shell-thread-container", className)}>{children}</div>;
};

export const ScrollArea = ({
  children,
  className,
  scrollVariant = "always",
  userMessageSelector,
}: {
  children?: React.ReactNode;
  className?: string;
  /**
   * Scroll to bottom once the last message is added
   */
  scrollVariant?: "always" | "once" | "user-message-anchor";
  /**
   * Selector for the user message
   */
  userMessageSelector?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { messages, isRunning } = useThreadState();

  useScrollToBottom({
    ref,
    lastMessage: messages[messages.length - 1] || { id: "" },
    scrollVariant,
    userMessageSelector,
    isRunning,
  });

  return (
    <div ref={ref} className={clsx("crayon-shell-thread-scroll-area", className)}>
      {children}
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
      {isRunning && loader}
    </div>
  );
};

export const Composer = ({ className }: { className?: string }) => {
  const { textContent, setTextContent } = useComposerState();
  const { processMessage, onCancel } = useThreadActions();
  const { isRunning, isLoadingMessages } = useThreadState();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!textContent.trim() || isRunning || isLoadingMessages) {
      return;
    }

    processMessage({
      type: "prompt",
      role: "user",
      message: textContent,
    });

    setTextContent("");
  };

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    input.style.height = "0px";
    input.style.height = `${input.scrollHeight}px`;
  }, [textContent]);

  return (
    <div className={clsx("crayon-shell-thread-composer", className)}>
      <div className="crayon-shell-thread-composer__input-wrapper">
        <textarea
          ref={inputRef}
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          className="crayon-shell-thread-composer__input"
          placeholder="Type your message..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <IconButton
          onClick={isRunning ? onCancel : handleSubmit}
          icon={isRunning ? <Square size="1em" fill="currentColor" /> : <ArrowRight size="1em" />}
        />
      </div>
    </div>
  );
};
