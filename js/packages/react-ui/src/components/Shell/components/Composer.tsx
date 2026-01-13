import { useThreadActions, useThreadState } from "@crayonai/react-core";
import clsx from "clsx";
import { ArrowRight, Square } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { useComposerState } from "../../../hooks/useComposerState";
import { IconButton } from "../../IconButton";

export interface ComposerProps {
  className?: string;
  placeholder?: string;
}

export const Composer = ({
  className,
  placeholder = "Type your message...",
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
          placeholder={placeholder}
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

export default Composer;
