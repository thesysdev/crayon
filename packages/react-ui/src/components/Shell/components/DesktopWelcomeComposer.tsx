import { useThread } from "@openuidev/react-headless";
import clsx from "clsx";
import { ArrowUp, Square } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { useComposerState } from "../../../hooks/useComposerState";
import { IconButton } from "../../IconButton";
import type { AttachmentConfig } from "../utils/checks";
import { isAttachmentConfig } from "../utils/checks";

export interface DesktopWelcomeComposerProps {
  className?: string;
  placeholder?: string;
  attachment?: React.ReactNode | AttachmentConfig;
}

export const DesktopWelcomeComposer = ({
  className,
  placeholder = "Type your query here",
  attachment,
}: DesktopWelcomeComposerProps) => {
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
          className="openui-shell-desktop-welcome-composer__attach-button"
        />
      );
    }
    return attachment;
  };

  return (
    <div className={clsx("openui-shell-desktop-welcome-composer", className)}>
      <textarea
        ref={inputRef}
        value={textContent}
        onChange={(e) => setTextContent(e.target.value)}
        className="openui-shell-desktop-welcome-composer__input"
        placeholder={placeholder}
        rows={1}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <div className="openui-shell-desktop-welcome-composer__action-bar">
        {renderAttachment()}
        <IconButton
          onClick={isRunning ? cancelMessage : handleSubmit}
          disabled={!textContent.trim() && !isRunning}
          aria-label={isRunning ? "Cancel" : "Send"}
          icon={isRunning ? <Square size="1em" fill="currentColor" /> : <ArrowUp size="1em" />}
          size="medium"
          variant="primary"
          className="openui-shell-desktop-welcome-composer__submit-button"
        />
      </div>
    </div>
  );
};

export default DesktopWelcomeComposer;
