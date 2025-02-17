import {
  Message,
  useThreadActions,
  useThreadManagerSelector,
  useThreadState,
} from "@crayonai/react-core";
import clsx from "clsx";
import { ArrowRight, Square } from "lucide-react";
import React, { useLayoutEffect, useRef } from "react";
import { useComposerState } from "../../hooks/useComposerState";
import { useScrollToBottom } from "../../hooks/useScrollToBottom";
import { IconButton } from "../IconButton";
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
  const { messages } = useThreadState();

  useScrollToBottom({
    ref,
    lastMessage: messages[messages.length - 1] || { id: "" },
    scrollVariant,
    userMessageSelector,
  });

  return (
    <div ref={ref} className={clsx("crayon-shell-thread-scroll-area", className)}>
      {children}
    </div>
  );
};

const FallbackTemplate = () => {
  return <div>Unable to render the response</div>;
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

export const RenderMessage = ({ message, className }: { message: Message; className?: string }) => {
  const responseTemplates = useThreadManagerSelector((store) => store.responseTemplates);
  const MessageContainer =
    message.role === "user" ? UserMessageContainer : AssistantMessageContainer;

  if (message.role === "assistant") {
    return (
      <MessageContainer className={className}>
        {message.message?.map((stringOrTemplate, i) => {
          if (typeof stringOrTemplate === "string") {
            return (
              <div key={i} className="crayon-shell-thread-message-assistant__text">
                {stringOrTemplate}
              </div>
            );
          }

          const Template = responseTemplates[stringOrTemplate.name];
          const Fallback = responseTemplates["fallback"]?.Component || FallbackTemplate;
          return Template ? (
            <Template.Component key={i} {...stringOrTemplate.templateProps} />
          ) : (
            <Fallback key={i} />
          );
        })}
      </MessageContainer>
    );
  }

  return <MessageContainer>{message.message}</MessageContainer>;
};

export const Messages = ({ className }: { className?: string }) => {
  const { messages } = useThreadState();

  return (
    <div className={clsx("crayon-shell-thread-messages", className)}>
      {messages.map((message) => {
        if (message.isVisuallyHidden) {
          return null;
        }
        return <RenderMessage key={message.id} message={message} />;
      })}
    </div>
  );
};

export const Composer = ({ className }: { className?: string }) => {
  const { textContent, setTextContent } = useComposerState();
  const { processMessage, onCancel } = useThreadActions();
  const { isRunning } = useThreadState();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!textContent.trim() || isRunning) {
      return;
    }

    processMessage({
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
