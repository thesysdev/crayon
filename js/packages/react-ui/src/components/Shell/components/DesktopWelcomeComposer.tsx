import { useThreadActions, useThreadState } from "@crayonai/react-core";
import clsx from "clsx";
import { ArrowUp, Paperclip, Square } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { useComposerState } from "../../../hooks/useComposerState";

export interface DesktopWelcomeComposerProps {
  className?: string;
  placeholder?: string;
}

export const DesktopWelcomeComposer = ({
  className,
  placeholder = "Type your query here",
}: DesktopWelcomeComposerProps) => {
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
    <div className={clsx("crayon-shell-desktop-welcome-composer", className)}>
      <div className="crayon-shell-desktop-welcome-composer__input-container">
        <textarea
          ref={inputRef}
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          className="crayon-shell-desktop-welcome-composer__input"
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
      </div>
      <div className="crayon-shell-desktop-welcome-composer__actions">
        <button
          type="button"
          className="crayon-shell-desktop-welcome-composer__action-button crayon-shell-desktop-welcome-composer__action-button--secondary"
          aria-label="Attach file"
        >
          <Paperclip size={16} />
        </button>
        <button
          type="button"
          className="crayon-shell-desktop-welcome-composer__action-button crayon-shell-desktop-welcome-composer__action-button--primary"
          onClick={isRunning ? onCancel : handleSubmit}
          disabled={!textContent.trim() && !isRunning}
          aria-label={isRunning ? "Stop" : "Send"}
        >
          {isRunning ? <Square size={16} fill="currentColor" /> : <ArrowUp size={16} />}
        </button>
      </div>
    </div>
  );
};

export default DesktopWelcomeComposer;
