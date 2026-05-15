import type { ThinkItem } from "@openuidev/react-headless";
import { ThinkItemType } from "@openuidev/react-headless";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, CircleDot, Globe, SquareCode } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SourceIcon } from "./SourceIcon";
import { ToolCodeBlock } from "./ToolCodeBlock";

export interface BehindTheScenesProps {
  items: ThinkItem[];
  isThinking: boolean;
}

const REVEAL_INTERVAL = 600;

const ToolCallItem = ({
  data,
  isLast,
  isThinking,
}: {
  data: ThinkItem["data"] & {
    toolName: string;
    toolCallTitle?: string;
    toolRequest?: string;
    toolResponse?: string;
    reasoning?: string;
    isError?: string;
  };
  isLast: boolean;
  isThinking: boolean;
}) => {
  const isRunning = isThinking && isLast;
  const title =
    data.toolCallTitle ??
    (isRunning ? `Calling the ${data.toolName} tool` : `Called the ${data.toolName} tool`);
  return (
    <TimelineItem
      icon={<SquareCode size={14} className="openui-tool-call__icon" />}
      title={title}
      isLast={isLast}
      isThinking={isThinking}
    >
      {data.reasoning && <p className="openui-tool-call__reasoning">{data.reasoning}</p>}
      {data.toolRequest && (
        <ToolCodeBlock
          type="request"
          code={data.toolRequest}
          isRunning={isRunning && !data.toolResponse}
          toolName={data.toolName}
        />
      )}
      {data.toolResponse && (
        <ToolCodeBlock
          type="response"
          code={data.toolResponse}
          isRunning={isRunning}
          toolName={data.toolName}
        />
      )}
    </TimelineItem>
  );
};

const WebSearchItem = ({
  data,
  isLast,
  isThinking,
}: {
  data: ThinkItem["data"] & {
    searchQuery: string;
    sources: any[];
    reasoning?: string;
    isError?: string;
    errorMessage?: string;
  };
  isLast: boolean;
  isThinking: boolean;
}) => {
  return (
    <TimelineItem
      icon={<Globe size={14} className="openui-tool-call__icon" />}
      title={data.searchQuery}
      isLast={isLast}
      isThinking={isThinking}
    >
      {data.reasoning && <p className="openui-tool-call__reasoning">{data.reasoning}</p>}
      {data.isError === "true" && data.errorMessage ? (
        <ToolCodeBlock
          type="response"
          code={data.errorMessage}
          isRunning={false}
          toolName="Web Search"
        />
      ) : data.sources?.length > 0 ? (
        <div className="openui-tool-call__sources">
          {data.sources.map((s: any) => (
            <a
              key={s.sourceUrl}
              className="openui-tool-call__source"
              href={s.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="openui-tool-call__source-left">
                <SourceIcon src={s.sourceLogoSrc} />
                <span className="openui-tool-call__source-title">{s.sourceTitle}</span>
              </div>
              <span className="openui-tool-call__source-desc">{s.sourceDescription}</span>
            </a>
          ))}
        </div>
      ) : null}
    </TimelineItem>
  );
};

const TimelineItem = ({
  icon,
  title,
  isLast,
  isThinking,
  children,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  isLast: boolean;
  isThinking: boolean;
  children?: React.ReactNode;
}) => {
  const active = isThinking && isLast;
  return (
    <div className="openui-tool-call">
      <div className="openui-tool-call__title-row">
        <span
          className={`openui-tool-call__icon-wrapper${active ? " openui-tool-call__icon--blinking" : ""}`}
        >
          {icon}
        </span>
        <span
          className={`openui-tool-call__name${active ? " openui-tool-call__name--shimmer" : ""}`}
        >
          {title}
        </span>
      </div>
      <div
        className={`openui-tool-call__connector${isLast ? " openui-tool-call__connector--last" : ""}`}
      >
        {children && <div className="openui-tool-call__args-block">{children}</div>}
      </div>
    </div>
  );
};

const renderItem = (item: ThinkItem, isLast: boolean, isThinking: boolean) => {
  switch (item.type) {
    case ThinkItemType.TOOL_CALL:
      return <ToolCallItem data={item.data} isLast={isLast} isThinking={isThinking} />;
    case ThinkItemType.WEB_SEARCH:
      return <WebSearchItem data={item.data} isLast={isLast} isThinking={isThinking} />;
    case ThinkItemType.PLAIN_TEXT:
      return (
        <TimelineItem
          icon={<CircleDot size={14} className="openui-tool-call__icon" />}
          title={item.data.text}
          isLast={isLast}
          isThinking={isThinking}
        />
      );
    case ThinkItemType.ERROR:
      return null;
    default:
      return null;
  }
};

export const BehindTheScenes = ({ items, isThinking }: BehindTheScenesProps) => {
  const [expanded, setExpanded] = useState(false);
  const [revealedCount, setRevealedCount] = useState(1);
  const prevThinking = useRef(isThinking);

  useEffect(() => {
    if (!prevThinking.current && isThinking) {
      setRevealedCount(1);
      setExpanded(false);
    }
    if (prevThinking.current && !isThinking) {
      setExpanded(false);
      setRevealedCount(items.length);
    }
    prevThinking.current = isThinking;
  }, [isThinking, items.length]);

  // Only advance when the current item has data (not just empty args from TOOL_CALL_START)
  const currentItemReady = (() => {
    const item = items[revealedCount - 1];
    if (!item) return true;
    if (item.type === ThinkItemType.TOOL_CALL) {
      return !!(item.data as any).toolRequest || !!(item.data as any).toolResponse;
    }
    return true; // PLAIN_TEXT, WEB_SEARCH, ERROR are always ready
  })();

  useEffect(() => {
    if (revealedCount < items.length && currentItemReady) {
      const timer = setTimeout(() => setRevealedCount((c) => c + 1), REVEAL_INTERVAL);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [items.length, revealedCount, currentItemReady]);

  if (items.length === 0) return null;

  const revealing = revealedCount < items.length;
  const showCompact = (isThinking || revealing) && !expanded;
  const currentItem = items[Math.min(revealedCount - 1, items.length - 1)]!;

  return (
    <div className="openui-behind-the-scenes">
      <button
        className="openui-behind-the-scenes__toggle"
        onClick={() => setExpanded((v) => !v)}
        type="button"
      >
        {expanded ? (
          <ChevronUp size={14} className="openui-behind-the-scenes__toggle-icon" />
        ) : (
          <ChevronDown size={14} className="openui-behind-the-scenes__toggle-icon" />
        )}
        {isThinking || revealing ? "Working..." : "Behind the scenes"}
      </button>

      {showCompact && (
        <div className="openui-behind-the-scenes__items">
          <AnimatePresence mode="wait">
            <motion.div
              key={revealedCount}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ width: "100%" }}
            >
              {renderItem(currentItem, true, true)}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {expanded && (
        <div className="openui-behind-the-scenes__items">
          {items.map((item, idx) => (
            <div key={item.data.id ?? idx} style={{ width: "100%" }}>
              {renderItem(item, idx === items.length - 1, false)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
