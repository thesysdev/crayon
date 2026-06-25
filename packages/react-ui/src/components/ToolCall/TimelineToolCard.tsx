import type { ToolActivity } from "@openuidev/react-headless";
import { CircleDot } from "lucide-react";
import { memo } from "react";
import { Collapsible } from "../_shared/Collapsible";
import { ToolCall } from "./ToolCallPrimitives";

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
