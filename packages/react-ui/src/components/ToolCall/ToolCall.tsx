import type { ToolCall } from "@openuidev/react-headless";
import clsx from "clsx";
import { Globe, SquareCode } from "lucide-react";
import { SourceIcon } from "./SourceIcon";
import { ToolCodeBlock } from "./ToolCodeBlock";

export interface ToolCallProps {
  toolCall: ToolCall;
  isStreaming?: boolean;
  /** True once tool work is done (e.g. text content has started rendering) */
  toolsDone?: boolean;
  isLast?: boolean;
  className?: string;
}

export const ToolCallComponent = ({
  toolCall,
  isStreaming,
  toolsDone,
  isLast = false,
  className,
}: ToolCallProps) => {
  const isRunning = !!isStreaming && !toolsDone;
  const toolName = toolCall.function.name;

  let parsedArgs: Record<string, unknown> | null = null;
  try {
    parsedArgs = JSON.parse(toolCall.function.arguments);
  } catch {
    // not parseable yet (partial JSON during streaming)
  }

  const title = parsedArgs?.["_title"] as string | undefined;
  const reasoning = parsedArgs?.["_reasoning"] as string | undefined;
  const isWebSearch = parsedArgs?.["_type"] === "WEB_SEARCH";
  const sources =
    isWebSearch && Array.isArray(parsedArgs?.["_sources"])
      ? (parsedArgs!["_sources"] as Array<{
          sourceTitle: string;
          sourceDescription: string;
          sourceUrl: string;
          sourceLogoSrc?: string;
        }>)
      : null;

  const hasRequest = parsedArgs && parsedArgs["_request"] != null;
  const hasResponse = parsedArgs && parsedArgs["_response"] != null;
  const requestStr = hasRequest ? JSON.stringify(parsedArgs!["_request"], null, 2) : null;
  const responseStr = hasResponse ? JSON.stringify(parsedArgs!["_response"], null, 2) : null;

  const plainArgs =
    !hasRequest && !hasResponse && !isWebSearch && toolCall.function.arguments
      ? (() => {
          try {
            return JSON.stringify(JSON.parse(toolCall.function.arguments), null, 2);
          } catch {
            return toolCall.function.arguments;
          }
        })()
      : null;

  const actionLabel = title
    ? title
    : isRunning
      ? `Calling the ${toolName} tool`
      : `Called the ${toolName} tool`;

  return (
    <div className={clsx("openui-tool-call", className)}>
      <div className="openui-tool-call__title-row">
        <span
          className={clsx("openui-tool-call__icon-wrapper", {
            "openui-tool-call__icon--blinking": isRunning && isLast,
          })}
        >
          {isWebSearch ? (
            <Globe size={14} className="openui-tool-call__icon" />
          ) : (
            <SquareCode size={14} className="openui-tool-call__icon" />
          )}
        </span>
        <span
          className={clsx("openui-tool-call__name", {
            "openui-tool-call__name--shimmer": isRunning && isLast,
          })}
        >
          {actionLabel}
        </span>
      </div>
      <div
        className={clsx("openui-tool-call__connector", {
          "openui-tool-call__connector--last": isLast,
        })}
      >
        <div className="openui-tool-call__args-block">
          {reasoning && <p className="openui-tool-call__reasoning">{reasoning}</p>}
          {sources ? (
            <div className="openui-tool-call__sources">
              {sources.map((source) => (
                <a
                  key={source.sourceUrl}
                  className="openui-tool-call__source"
                  href={source.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="openui-tool-call__source-left">
                    <SourceIcon src={source.sourceLogoSrc} />
                    <span className="openui-tool-call__source-title">{source.sourceTitle}</span>
                  </div>
                  <span className="openui-tool-call__source-desc">{source.sourceDescription}</span>
                </a>
              ))}
            </div>
          ) : (
            <>
              {requestStr && (
                <ToolCodeBlock
                  type="request"
                  code={requestStr}
                  isRunning={isRunning && !hasResponse}
                  toolName={toolName}
                />
              )}
              {responseStr && (
                <ToolCodeBlock
                  type="response"
                  code={responseStr}
                  isRunning={isRunning && isLast}
                  toolName={toolName}
                />
              )}
              {plainArgs && (
                <ToolCodeBlock
                  type="request"
                  code={plainArgs}
                  isRunning={isRunning}
                  toolName={toolName}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
