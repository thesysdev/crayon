import { useThread } from "@openuidev/react-headless";
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
  const processMessage = useThread((s) => s.processMessage);
  const cancelMessage = useThread((s) => s.cancelMessage);
  const isRunning = useThread((s) => s.isRunning);
  const isLoadingMessages = useThread((s) => s.isLoadingMessages);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!textContent.trim() || isRunning || isLoadingMessages) {
      return;
    }

    processMessage({
      role: "user",
      content: textContent,
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
          className="openui-copilot-shell-thread-composer__attach-button"
        />
      );
    }
    return attachment;
  };

  return (
    <div className={clsx("openui-copilot-shell-thread-composer", className)}>
      <div className="openui-copilot-shell-thread-composer__input-wrapper">
        <textarea
          ref={inputRef}
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          className="openui-copilot-shell-thread-composer__input"
          placeholder={placeholder}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <div className="openui-copilot-shell-thread-composer__action-bar">
          {renderAttachment()}
          <IconButton
            onClick={isRunning ? cancelMessage : handleSubmit}
            icon={isRunning ? <Square size="1em" fill="currentColor" /> : <ArrowUp size="1em" />}
            size="medium"
            variant="primary"
            className="openui-copilot-shell-thread-composer__submit-button"
          />
        </div>
      </div>
    </div>
  );
};

export default Composer;
