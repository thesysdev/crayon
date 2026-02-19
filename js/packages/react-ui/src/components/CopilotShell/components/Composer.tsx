import { useThreadActions, useThreadState } from "@crayonai/react-core";
import clsx from "clsx";
import { ArrowUp, Square } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { useComposerState } from "../../../hooks/useComposerState";
import { IconButton } from "../../IconButton";
import type { AttachmentConfig } from "../../Shell/utils/checks";
import { isAttachmentConfig } from "../../Shell/utils/checks";

export interface ComposerProps {
  className?: string;
  placeholder?: string;
  attachment?: React.ReactNode | AttachmentConfig;
}

export const Composer = ({
  className,
  placeholder = "Type your message...",
  attachment,
}: ComposerProps) => {
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
    if (!input) return;

    input.style.height = "auto";
    input.style.height = `${input.scrollHeight}px`;
  }, [textContent]);

  const renderAttachment = () => {
    if (!attachment) return null;
    if (isAttachmentConfig(attachment)) {
      return (
        <IconButton
          icon={attachment.icon}
          onClick={attachment.onClick}
          size="medium"
          variant="tertiary"
          className="crayon-copilot-shell-thread-composer__attach-button"
        />
      );
    }
    return attachment;
  };

  return (
    <div className={clsx("crayon-copilot-shell-thread-composer", className)}>
      <div className="crayon-copilot-shell-thread-composer__input-wrapper">
        <textarea
          ref={inputRef}
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          className="crayon-copilot-shell-thread-composer__input"
          placeholder={placeholder}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <div className="crayon-copilot-shell-thread-composer__action-bar">
          {renderAttachment()}
          <IconButton
            onClick={isRunning ? onCancel : handleSubmit}
            icon={isRunning ? <Square size="1em" fill="currentColor" /> : <ArrowUp size="1em" />}
            size="medium"
            variant="primary"
            className="crayon-copilot-shell-thread-composer__submit-button"
          />
        </div>
      </div>
    </div>
  );
};

export default Composer;
