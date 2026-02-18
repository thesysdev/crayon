import { useThreadActions, useThreadState } from "@crayonai/react-core";
import clsx from "clsx";
import { ArrowUp, Paperclip, Square } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { useComposerState } from "../../../hooks/useComposerState";
import { IconButton } from "../../IconButton";

export interface ComposerProps {
  className?: string;
  placeholder?: string;
  onAttachmentClick?: () => void;
}

export const Composer = ({
  className,
  placeholder = "Type your query here",
  onAttachmentClick,
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

  return (
    <div className={clsx("crayon-shell-thread-composer", className)}>
      <div className="crayon-shell-thread-composer__input-wrapper">
        <textarea
          ref={inputRef}
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          className="crayon-shell-thread-composer__input"
          placeholder={placeholder}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <div className="crayon-shell-thread-composer__action-bar">
          <IconButton
            icon={<Paperclip size="1em" />}
            onClick={onAttachmentClick}
            size="medium"
            variant="tertiary"
            className="crayon-shell-thread-composer__attach-button"
          />
          <IconButton
            onClick={isRunning ? onCancel : handleSubmit}
            icon={isRunning ? <Square size="1em" fill="currentColor" /> : <ArrowUp size="1em" />}
            size="medium"
            variant="primary"
            className="crayon-shell-thread-composer__submit-button"
          />
        </div>
      </div>
    </div>
  );
};

export default Composer;
