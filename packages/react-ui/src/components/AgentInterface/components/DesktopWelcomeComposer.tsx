import { useThread, useThreadList } from "@openuidev/react-headless";
import clsx from "clsx";
import { ArrowUp, Square } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { useLayoutContext } from "../../../context/LayoutContext";
import { useAutoFocus } from "../../../hooks/useAutoFocus";
import { useComposerState } from "../../../hooks/useComposerState";
import { IconButton } from "../../IconButton";

export interface DesktopWelcomeComposerProps {
  className?: string;
  placeholder?: string;
}

export const DesktopWelcomeComposer = ({
  className,
  placeholder = "Type your query here",
}: DesktopWelcomeComposerProps) => {
  const { textContent, setTextContent } = useComposerState();
  const processMessage = useThread((s) => s.processMessage);
  const cancelMessage = useThread((s) => s.cancelMessage);
  const isRunning = useThread((s) => s.isRunning);
  const isLoadingMessages = useThread((s) => s.isLoadingMessages);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const selectedThreadId = useThreadList((s) => s.selectedThreadId);
  const { layout } = useLayoutContext();

  useAutoFocus(inputRef, {
    enabled: layout !== "mobile" && !isLoadingMessages,
    focusKey: selectedThreadId,
  });

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

    // Reset to 0 (not "auto") so scrollHeight reflects content, not container
    input.style.height = "0px";
    input.style.height = `${Math.max(input.scrollHeight, 24)}px`;
  }, [textContent]);

  return (
    <div
      className={clsx("openui-agent-desktop-welcome-composer", className)}
      data-drafting={textContent.length > 0 || undefined}
    >
      <textarea
        ref={inputRef}
        value={textContent}
        onChange={(e) => setTextContent(e.target.value)}
        className="openui-agent-desktop-welcome-composer__input"
        placeholder={placeholder}
        rows={1}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <div className="openui-agent-desktop-welcome-composer__action-bar">
        <IconButton
          onClick={isRunning ? cancelMessage : handleSubmit}
          disabled={!textContent.trim() && !isRunning}
          aria-label={isRunning ? "Cancel" : "Send"}
          icon={isRunning ? <Square size="1em" fill="currentColor" /> : <ArrowUp size="1em" />}
          size="extra-small"
          variant="primary"
          className="openui-agent-desktop-welcome-composer__submit-button"
        />
      </div>
    </div>
  );
};

export default DesktopWelcomeComposer;
