import { useThread } from "@openuidev/react-headless";
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
  const processMessage = useThread((s) => s.processMessage);
  const cancelMessage = useThread((s) => s.cancelMessage);
  const isRunning = useThread((s) => s.isRunning);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!textContent.trim() || isRunning) {
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
    if (!input) {
      return;
    }

    input.style.height = "auto";
    input.style.height = `${input.scrollHeight}px`;
  }, [textContent]);

  return (
    <div className={clsx("openui-shell-desktop-welcome-composer", className)}>
      <div className="openui-shell-desktop-welcome-composer__input-container">
        <textarea
          autoFocus
          ref={inputRef}
          rows={1}
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          className="openui-shell-desktop-welcome-composer__input"
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
      </div>
      <div className="openui-shell-desktop-welcome-composer__actions">
        <IconButton
          onClick={isRunning ? cancelMessage : handleSubmit}
          disabled={!textContent.trim() && !isRunning}
          icon={isRunning ? <Square size="1em" fill="currentColor" /> : <ArrowUp size="1em" />}
        />
      </div>
    </div>
  );
};

export default DesktopWelcomeComposer;
