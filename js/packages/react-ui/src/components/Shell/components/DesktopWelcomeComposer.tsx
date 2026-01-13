import { useThreadActions, useThreadState } from "@crayonai/react-core";
import clsx from "clsx";
import { ArrowUp, Square } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { useComposerState } from "../../../hooks/useComposerState";
import { IconButton } from "../../IconButton";

export interface DesktopWelcomeComposerProps {
  className?: string;
  placeholder?: string;
}

export const DesktopWelcomeComposer = ({
  className,
  placeholder = "Type your message...",
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
        <IconButton
          onClick={isRunning ? onCancel : handleSubmit}
          disabled={!textContent.trim() && !isRunning}
          icon={isRunning ? <Square size="1em" fill="currentColor" /> : <ArrowUp size="1em" />}
        />
      </div>
    </div>
  );
};

export default DesktopWelcomeComposer;
