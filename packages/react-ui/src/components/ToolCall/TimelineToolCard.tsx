import type { ToolActivity } from "@openuidev/react-headless";
import { CircleDot } from "lucide-react";
import { memo } from "react";
import { Collapsible } from "../_shared/Collapsible";
import { SourceIcon } from "./SourceIcon";
import { ToolCall } from "./ToolCallPrimitives";
import { extractToolSources } from "./toolSources";

/** Favicon + title rows for the links a tool's result carries (see
 *  {@link extractToolSources} — per-tool formats live in one registry).
 *  Renders nothing when the tool/result yields no links. */
const ToolSources = ({ toolName, result }: { toolName: string; result: string }) => {
  const sources = extractToolSources(toolName, result);
  if (sources.length === 0) return null;
  return (
    <div className="openui-tool-call__sources">
      {sources.map((source) => (
        <a
          key={source.url}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="openui-tool-call__source"
        >
          <span className="openui-tool-call__source-left">
            <SourceIcon src={`https://www.google.com/s2/favicons?domain=${source.host}&sz=64`} />
            <span className="openui-tool-call__source-title">{source.title}</span>
          </span>
          <span className="openui-tool-call__source-desc">{source.siteName}</span>
        </a>
      ))}
    </div>
  );
};

/**
 * Timeline-shaped composition of the compound {@link ToolCall} parts — the
 * molded `StatusStep` + `TimelineItem` (dot + connector). The running shimmer
 * is `(streaming|executing) && isLast`, derived from the lifecycle status via
 * the parts' `data-spin`, not a separate `isThinking` flag. `ToolCall.Root` is
 * the single `.openui-tool-call` container, so we compose *inside* it.
 *
 * @category Components
 */
export const TimelineToolCard = memo(function TimelineToolCard({
  activity,
  isLast,
  isRunning = true,
}: {
  activity: ToolActivity;
  isLast: boolean;
  /** Whether the owning thread is still running — gates the running shimmer/spin
   *  so a closed-args call with no result doesn't animate forever after the run ends. */
  isRunning?: boolean;
}) {
  return (
    <ToolCall.Root activity={activity} isLast={isLast} running={isRunning}>
      <div className="openui-tool-call__title-row">
        <ToolCall.StatusIcon
          render={(_state, props) => (
            <span
              className={`openui-tool-call__icon-wrapper${
                props["data-spin"] ? " openui-tool-call__icon--blinking" : ""
              }`}
              data-status={props["data-status"] as string}
            >
              <CircleDot size={14} className="openui-tool-call__icon" />
            </span>
          )}
        />
        <ToolCall.StatusText
          render={(state, props) => (
            <span
              // Announce tool-call status transitions (Calling → Running →
              // Called/failed) to assistive tech; only changes are spoken, so
              // settled/historical cards stay quiet.
              role="status"
              aria-live="polite"
              className={`openui-tool-call__name${
                (state.status === "streaming" || state.status === "executing") &&
                isLast &&
                isRunning
                  ? " openui-tool-call__name--shimmer"
                  : ""
              }`}
            >
              {props["children"] as string}
            </span>
          )}
        />
      </div>

      <div
        className={`openui-tool-call__connector${
          isLast ? " openui-tool-call__connector--last" : ""
        }`}
      >
        <div className="openui-tool-call__args-block">
          {typeof activity.result === "string" && (
            <ToolSources toolName={activity.toolName} result={activity.result} />
          )}
          {/* request → typed input, response → paired result, both collapsible */}
          <Collapsible
            label="Tool Request"
            labelLoading={`Sending request to ${activity.toolName}...`}
            loading={isRunning && isLast && activity.status === "streaming"}
          >
            <ToolCall.Parameters
              render={(_s, p) => (
                <pre className="openui-tool-code-block__code">{p["children"] as string}</pre>
              )}
            />
          </Collapsible>
          {/* ToolCall.Result returns null until a result/error lands, so the
              response collapsible only appears once it does. */}
          <ToolCall.Result
            render={(s, p) => (
              <Collapsible
                label="Tool Response"
                labelLoading={`Awaiting response from ${activity.toolName}...`}
                loading={isRunning && isLast && activity.status === "executing"}
              >
                <pre
                  className={`openui-tool-code-block__code${
                    s.isError ? " openui-tool-code-block__code--error" : ""
                  }`}
                >
                  {p["children"] as string}
                </pre>
              </Collapsible>
            )}
          />
        </div>
      </div>
    </ToolCall.Root>
  );
});
