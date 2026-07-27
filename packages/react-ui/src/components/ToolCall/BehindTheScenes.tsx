import { ChevronDown, ChevronUp } from "lucide-react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

export interface BehindTheScenesProps {
  /** True while the overall message is still streaming */
  isStreaming?: boolean;
  /** True once all tool calls have received their arguments back */
  toolCallsComplete?: boolean;
  children: React.ReactNode;
}

export const BehindTheScenes = ({
  isStreaming,
  toolCallsComplete,
  children,
}: BehindTheScenesProps) => {
  // null = auto-managed, boolean = user override
  const [userOverride, setUserOverride] = useState<boolean | null>(null);
  // Once tools complete, latch closed — never auto-open again for this message
  const hasCompletedOnce = useRef(false);
  const prevStreaming = useRef(isStreaming);

  // Reset everything when a new streaming session starts
  useEffect(() => {
    if (isStreaming && !prevStreaming.current) {
      setUserOverride(null);
      hasCompletedOnce.current = false;
    }
    prevStreaming.current = isStreaming;
  }, [isStreaming]);

  // Latch: once tool calls complete, remember it forever for this session
  if (toolCallsComplete && !hasCompletedOnce.current) {
    hasCompletedOnce.current = true;
  }

  const toolsActive = !!isStreaming && !hasCompletedOnce.current;
  const autoExpanded = toolsActive;
  const isExpanded = userOverride !== null ? userOverride : autoExpanded;

  const toggle = () => {
    setUserOverride((prev) => (prev !== null ? !prev : !isExpanded));
  };

  const panelId = useId();

  // The items tray scrolls internally past its max-height (see toolCall.scss).
  // While tools are active, follow the newest step — unless the user has
  // scrolled up to read an earlier one (24px slack, same heuristic as chat
  // auto-scroll), in which case leave their position alone.
  const itemsRef = useRef<HTMLDivElement>(null);
  const followRef = useRef(true);
  const handleItemsScroll = useCallback(() => {
    const el = itemsRef.current;
    if (!el) return;
    followRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
  }, []);
  useLayoutEffect(() => {
    if (!toolsActive || !isExpanded || !followRef.current) return;
    const el = itemsRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  });

  return (
    <div className="openui-behind-the-scenes">
      <button
        className="openui-behind-the-scenes__toggle"
        onClick={toggle}
        type="button"
        aria-expanded={isExpanded}
        aria-controls={panelId}
      >
        {isExpanded ? (
          <ChevronUp size={14} className="openui-behind-the-scenes__toggle-icon" />
        ) : (
          <ChevronDown size={14} className="openui-behind-the-scenes__toggle-icon" />
        )}
        {toolsActive ? "Working..." : "Behind the scenes"}
      </button>
      {isExpanded && (
        <div
          className="openui-behind-the-scenes__items"
          id={panelId}
          ref={itemsRef}
          onScroll={handleItemsScroll}
        >
          {children}
        </div>
      )}
    </div>
  );
};
