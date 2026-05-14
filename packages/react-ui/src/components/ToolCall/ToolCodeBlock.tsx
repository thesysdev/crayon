import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface ToolCodeBlockProps {
  type: "request" | "response";
  code: string;
  isRunning?: boolean;
  toolName: string;
}

export const ToolCodeBlock = ({ type, code, isRunning = false, toolName }: ToolCodeBlockProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const label = type === "request" ? "Tool Request" : "Tool Response";
  const runningLabel =
    type === "request"
      ? `Sending request to ${toolName}...`
      : `Awaiting response from ${toolName}...`;

  return (
    <div className="openui-tool-code-block">
      <button
        className="openui-tool-code-block__header"
        onClick={() => setIsExpanded((v) => !v)}
        type="button"
      >
        <span
          className={clsx("openui-tool-code-block__label", {
            "openui-tool-code-block__label--loading": isRunning,
          })}
        >
          {isRunning ? runningLabel : label}
        </span>
        <ChevronDown
          size={14}
          className={clsx("openui-tool-code-block__chevron", {
            "openui-tool-code-block__chevron--expanded": isExpanded,
          })}
        />
      </button>
      {isExpanded && (
        <div className="openui-tool-code-block__content">
          <pre className="openui-tool-code-block__code">{code}</pre>
        </div>
      )}
    </div>
  );
};
