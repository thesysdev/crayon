import {
  Message,
  MessageProvider,
  TextContentPart,
  UserMessage,
  UserMessageContentPart,
  useThreadActions,
  useThreadManagerSelector,
  useThreadState,
} from "@crayonai/react-core";
import clsx from "clsx";
import { ArrowRight, File, Image, Mic, Square, X } from "lucide-react";
import React, { memo, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import {
  AttachmentConfig,
  ComposerAttachment,
  getAudioAcceptString,
  getAudioFormat,
  getFileAcceptString,
  getImageAcceptString,
  isAudioFormatAllowed,
  isFileFormatAllowed,
  isImageFormatAllowed,
  useComposerState,
} from "../../hooks/useComposerState";
import { ScrollVariant, useScrollToBottom } from "../../hooks/useScrollToBottom";
import { IconButton } from "../IconButton";
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
  }, [isArtifactActive, setIsArtifactActive]);

  return <div className={clsx("crayon-copilot-shell-thread-container", className)}>{children}</div>;
};

export const ScrollArea = ({
  children,
  className,
  scrollVariant = "user-message-anchor",
  userMessageSelector = ".crayon-copilot-shell-thread-message-user",
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
    <div className="crayon-copilot-shell-thread-scroll-container">
      <div
        ref={ref}
        className={clsx(
          "crayon-copilot-shell-thread-scroll-area",
          {
            "crayon-copilot-shell-thread-scroll-area--user-message-anchor":
              scrollVariant === "user-message-anchor",
          },
          className,
        )}
      >
        {children}
      </div>
      {isArtifactActive && (
        <div className="crayon-copilot-shell-thread-artifact-panel--mobile">
          {artifactRenderer()}
        </div>
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
    <div className={clsx("crayon-copilot-shell-thread-message-assistant", className)}>
      <div className="crayon-copilot-shell-thread-message-assistant__content">{children}</div>
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
    <div className={clsx("crayon-copilot-shell-thread-message-user", className)}>
      <div className="crayon-copilot-shell-thread-message-user__content">{children}</div>
    </div>
  );
};

/**
 * Renders a user message content part (text, image, file, or audio)
 */
const RenderUserContentPart = ({
  part,
  index,
}: {
  part: UserMessageContentPart;
  index: number;
}) => {
  switch (part.type) {
    case "text":
      return (
        <span key={index} className="crayon-copilot-shell-thread-message-user__text">
          {part.text}
        </span>
      );
    case "image_url":
      return (
        <div key={index} className="crayon-copilot-shell-thread-message-user__attachment">
          <img
            src={part.image_url.url}
            alt="User attachment"
            className="crayon-copilot-shell-thread-message-user__image"
          />
        </div>
      );
    case "file":
      return (
        <div key={index} className="crayon-copilot-shell-thread-message-user__attachment">
          <div className="crayon-copilot-shell-thread-message-user__file">
            <File size={16} />
            <span>{part.file.filename}</span>
          </div>
        </div>
      );
    case "input_audio":
      return (
        <div key={index} className="crayon-copilot-shell-thread-message-user__attachment">
          <div className="crayon-copilot-shell-thread-message-user__audio">
            <Mic size={16} />
            <span>Audio ({part.input_audio.format})</span>
          </div>
        </div>
      );
    default:
      return null;
  }
};

/**
 * Renders user message content, handling both string and array formats
 */
const RenderUserMessageContent = ({ message }: { message: UserMessage }) => {
  const content = message.message;

  // Handle string content (legacy format)
  if (typeof content === "string") {
    return <>{content}</>;
  }

  // Handle array content (new format with attachments)
  if (Array.isArray(content)) {
    return (
      <div className="crayon-copilot-shell-thread-message-user__content-parts">
        {content.map((part, index) => (
          <RenderUserContentPart key={index} part={part} index={index} />
        ))}
      </div>
    );
  }

  return null;
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
                <TextRenderer
                  key={i}
                  className="crayon-copilot-shell-thread-message-assistant__text"
                >
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

    return (
      <MessageContainer>
        <RenderUserMessageContent message={message} />
      </MessageContainer>
    );
  },
);

export const MessageLoading = () => {
  return (
    <div className="crayon-copilot-shell-thread-message-loading">
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
    <div className={clsx("crayon-copilot-shell-thread-messages", className)}>
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

export type ComposerProps = {
  className?: string;
  /** Configuration for which attachment types are enabled */
  attachmentConfig?: AttachmentConfig;
};

/**
 * Helper to convert file to base64
 */
const fileToBase64 = (file: globalThis.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get pure base64
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = reject;
  });
};

/**
 * Helper to get file as data URL (for images)
 */
const fileToDataUrl = (file: globalThis.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
};

/**
 * Renders a preview of an attachment in the composer
 */
const AttachmentPreview = ({
  attachment,
  onRemove,
}: {
  attachment: ComposerAttachment;
  onRemove: () => void;
}) => {
  return (
    <div className="crayon-copilot-shell-thread-composer__attachment-preview">
      {attachment.type === "image_url" && (
        <img
          src={attachment.image_url.url}
          alt="Attachment preview"
          className="crayon-copilot-shell-thread-composer__attachment-image"
        />
      )}
      {attachment.type === "file" && (
        <div className="crayon-copilot-shell-thread-composer__attachment-file">
          <File size={16} />
          <span>{attachment.file.filename}</span>
        </div>
      )}
      {attachment.type === "input_audio" && (
        <div className="crayon-copilot-shell-thread-composer__attachment-audio">
          <Mic size={16} />
          <span>Audio ({attachment.input_audio.format})</span>
        </div>
      )}
      <button
        type="button"
        className="crayon-copilot-shell-thread-composer__attachment-remove"
        onClick={onRemove}
        aria-label="Remove attachment"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export const Composer = ({ className, attachmentConfig }: ComposerProps) => {
  const { textContent, setTextContent, attachments, addAttachment, removeAttachment, reset } =
    useComposerState();
  const { processMessage, onCancel } = useThreadActions();
  const { isRunning } = useThreadState();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const hasAttachments = attachments.length > 0;
  const hasContent = textContent.trim() || hasAttachments;

  const handleSubmit = useCallback(() => {
    if (!hasContent || isRunning) {
      return;
    }

    // Build message content
    let messageContent: string | UserMessageContentPart[];

    if (hasAttachments) {
      // Use array format when there are attachments
      const contentParts: UserMessageContentPart[] = [];

      // Add text if present
      if (textContent.trim()) {
        contentParts.push({
          type: "text",
          text: textContent.trim(),
        } as TextContentPart);
      }

      // Add attachments
      contentParts.push(...attachments);

      messageContent = contentParts;
    } else {
      // Use simple string format when no attachments
      messageContent = textContent;
    }

    processMessage({
      type: "prompt",
      role: "user",
      message: messageContent,
    });

    reset();
  }, [hasContent, isRunning, textContent, attachments, hasAttachments, processMessage, reset]);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || !attachmentConfig?.images) return;

      for (const file of Array.from(files)) {
        // Validate file format against config
        if (!isImageFormatAllowed(file.name, attachmentConfig.images)) {
          continue;
        }
        const dataUrl = await fileToDataUrl(file);
        addAttachment({
          type: "image_url",
          image_url: {
            url: dataUrl,
          },
        });
      }
      // Reset input
      e.target.value = "";
    },
    [addAttachment, attachmentConfig?.images],
  );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || !attachmentConfig?.files) return;

      for (const file of Array.from(files)) {
        // Validate file format against config
        if (!isFileFormatAllowed(file.name, attachmentConfig.files)) {
          continue;
        }
        const base64 = await fileToBase64(file);
        addAttachment({
          type: "file",
          file: {
            filename: file.name,
            file_data: base64,
          },
        });
      }
      // Reset input
      e.target.value = "";
    },
    [addAttachment, attachmentConfig?.files],
  );

  const handleAudioUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || !attachmentConfig?.audio) return;

      for (const file of Array.from(files)) {
        // Validate file format against config
        if (!isAudioFormatAllowed(file.name, attachmentConfig.audio)) {
          continue;
        }
        const base64 = await fileToBase64(file);
        const format = getAudioFormat(file.name);
        addAttachment({
          type: "input_audio",
          input_audio: {
            data: base64,
            format,
          },
        });
      }
      // Reset input
      e.target.value = "";
    },
    [addAttachment, attachmentConfig?.audio],
  );

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    input.style.height = "0px";
    input.style.height = `${input.scrollHeight}px`;
  }, [textContent]);

  return (
    <div className={clsx("crayon-copilot-shell-thread-composer", className)}>
      {/* Attachment previews */}
      {hasAttachments && (
        <div className="crayon-copilot-shell-thread-composer__attachments">
          {attachments.map((attachment, index) => (
            <AttachmentPreview
              key={index}
              attachment={attachment}
              onRemove={() => removeAttachment(index)}
            />
          ))}
        </div>
      )}

      <div className="crayon-copilot-shell-thread-composer__input-wrapper">
        {/* Attachment buttons */}
        {attachmentConfig && (
          <div className="crayon-copilot-shell-thread-composer__attachment-buttons">
            {attachmentConfig.images && (
              <>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept={getImageAcceptString(attachmentConfig.images)}
                  multiple
                  onChange={handleImageUpload}
                  className="crayon-copilot-shell-thread-composer__file-input"
                  aria-label="Upload image"
                />
                <IconButton
                  onClick={() => imageInputRef.current?.click()}
                  icon={<Image size="1em" />}
                  aria-label="Upload image"
                />
              </>
            )}
            {attachmentConfig.files && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={getFileAcceptString(attachmentConfig.files)}
                  multiple
                  onChange={handleFileUpload}
                  className="crayon-copilot-shell-thread-composer__file-input"
                  aria-label="Upload file"
                />
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  icon={<File size="1em" />}
                  aria-label="Upload file"
                />
              </>
            )}
            {attachmentConfig.audio && (
              <>
                <input
                  ref={audioInputRef}
                  type="file"
                  accept={getAudioAcceptString(attachmentConfig.audio)}
                  multiple
                  onChange={handleAudioUpload}
                  className="crayon-copilot-shell-thread-composer__file-input"
                  aria-label="Upload audio"
                />
                <IconButton
                  onClick={() => audioInputRef.current?.click()}
                  icon={<Mic size="1em" />}
                  aria-label="Upload audio"
                />
              </>
            )}
          </div>
        )}

        <textarea
          ref={inputRef}
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          className="crayon-copilot-shell-thread-composer__input"
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
