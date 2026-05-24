import type { ToolMessage } from "@openuidev/react-headless";
import clsx from "clsx";
import { AlertCircle, CheckCircle2, ChevronDown } from "lucide-react";
import { useState } from "react";

export interface ToolResultProps {
  message: ToolMessage;
  /** The name of the tool that was called (resolved from the parent assistant message's toolCalls) */
  toolName?: string;
  className?: string;
}

export const ToolResult = ({ message, toolName, className }: ToolResultProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasError = !!message.error;

  return (
    <div
      className={clsx("openui-tool-result", className, {
        "openui-tool-result--error": hasError,
      })}
    >
      <button
        className="openui-tool-result__header"
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        <div className="openui-tool-result__header-left">
          {hasError ? (
            <AlertCircle size={14} className="openui-tool-result__icon--error" />
          ) : (
            <CheckCircle2 size={14} className="openui-tool-result__icon--success" />
          )}
          <span className="openui-tool-result__label">
            {toolName ? `${toolName} result` : "Tool result"}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={clsx("openui-tool-result__chevron", {
            "openui-tool-result__chevron--expanded": isExpanded,
          })}
        />
      </button>
      {isExpanded && (
        <div className="openui-tool-result__content">
          {hasError && <div className="openui-tool-result__error">{message.error}</div>}
          <pre className="openui-tool-result__output">{message.content}</pre>
        </div>
      )}
    </div>
  );
};
