import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

  return (
    <div className="openui-behind-the-scenes">
      <button className="openui-behind-the-scenes__toggle" onClick={toggle} type="button">
        {isExpanded ? (
          <ChevronUp size={14} className="openui-behind-the-scenes__toggle-icon" />
        ) : (
          <ChevronDown size={14} className="openui-behind-the-scenes__toggle-icon" />
        )}
        {toolsActive ? "Working..." : "Behind the scenes"}
      </button>
      {isExpanded && <div className="openui-behind-the-scenes__items">{children}</div>}
    </div>
  );
};
