import type { AssistantMessage, Message } from "@openuidev/react-headless";
import {
  MessageProvider,
  lookupArtifactRenderer,
  useActiveDetailedView,
  useArtifactList,
  useArtifactRendererRegistry,
  useThread,
  useToolActivities,
} from "@openuidev/react-headless";
import clsx from "clsx";
import { ChevronDown, ChevronUp, Text } from "lucide-react";
import React, { memo, useEffect, useId, useRef, useState } from "react";
import { separateContentAndContext } from "../../utils/sentinelParser";
import { useLayoutContext } from "../../context/LayoutContext";
import { ScrollVariant, useScrollToBottom } from "../../hooks/useScrollToBottom";
import {
  DetailedViewOverlay,
  DetailedViewPanel,
  DetailedViewPortalTarget,
} from "./_shared/detailed-view";
import { useAgentInterfaceLabels } from "./_shared/labelsContext";
import { useAgentInterfaceStore } from "./_shared/store";
import { TimelineEntry } from "./_shared/tool-renderer";
import type { AssistantMessageComponent, UserMessageComponent } from "./_shared/types";

import { Callout } from "../Callout";
import { DotMatrixLoader } from "../DotMatrixLoader";
import { IconButton } from "../IconButton";
import { MarkDownRenderer } from "../MarkDownRenderer";
import { AgentInterfaceTooltip } from "./_shared/AgentInterfaceTooltip";
import { GalleryHorizontalEndIcon } from "./_shared/GalleryHorizontalEndIcon";
import { AmbientLoader } from "./components/AmbientLoader";
import { ScrollToLatest } from "./components/ScrollToLatest";
import { ResizableSeparator } from "./ResizableSeparator";
import { useDetailedViewResize } from "./useDetailedViewResize";
import { UserMessageContent } from "./UserMessageContent";

export const ThreadContainer = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  const { layout } = useLayoutContext();
  const isMobile = layout === "mobile";
  const { isDetailedViewActive } = useActiveDetailedView();

  const { setIsSidebarOpen } = useAgentInterfaceStore((state) => ({
    setIsSidebarOpen: state.setIsSidebarOpen,
  }));

  const isLoadingMessages = useThread((s) => s.isLoadingMessages);

  const {
    containerRef,
    chatPanelRef,
    detailedViewPanelRef,
    isDragging,
    handleResize,
    handleResizeStep,
    handleDragStart,
    handleDragEnd,
    getResizeAria,
  } = useDetailedViewResize({
    isDetailedViewActive,
    isMobile,
    setIsSidebarOpen,
  });

  const chatPanelId = useId();
  const detailPanelId = useId();

  return (
    <div
      className={clsx("openui-agent-thread-container", className, {
        "openui-agent-thread-container--detailed-view-active": isDetailedViewActive,
      })}
      style={{
        visibility: isLoadingMessages ? "hidden" : undefined,
      }}
    >
      {/* Full-screen loading state while a thread's messages load. The
          container above hides via `visibility` (keeps layout + scroll state);
          this overlay opts back in with `visibility: visible`. */}
      {isLoadingMessages && (
        <AmbientLoader
          className="openui-agent-thread-container__loading"
          label="Loading conversation…"
        />
      )}
      <div className="openui-agent-thread-wrapper" ref={containerRef}>
        {/* Chat panel - always visible */}
        <div
          ref={chatPanelRef}
          id={chatPanelId}
          className={clsx("openui-agent-thread-chat-panel", {
            "openui-agent-thread-chat-panel--animating": !isDragging,
          })}
        >
          {children}
          {isMobile && <DetailedViewOverlay />}
        </div>

        {/* Desktop only: Resizable separator and detailed-view panel */}
        {!isMobile && isDetailedViewActive && (
          <>
            <ResizableSeparator
              onResize={handleResize}
              onResizeStep={handleResizeStep}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              getAriaValues={getResizeAria}
              controlsId={`${chatPanelId} ${detailPanelId}`}
              ariaLabel="Resize chat panel"
            />
            <div
              ref={detailedViewPanelRef}
              id={detailPanelId}
              className={clsx("openui-agent-thread-detailed-view-panel", {
                "openui-agent-thread-detailed-view-panel--animating": !isDragging,
              })}
            >
              <DetailedViewPortalTarget />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const ScrollArea = ({
  children,
  className,
  scrollVariant = "user-message-anchor",
  userMessageSelector = ".openui-agent-thread-message-user, .openui-shell-thread-message-user",
  scrollOnLoad = true,
}: {
  children?: React.ReactNode;
  className?: string;
  /**
   * Scroll to bottom once the last message is added
   */
  scrollVariant?: ScrollVariant;
  /**
   * Selector for the user message
   */
  userMessageSelector?: string;
  /**
   * When false, do not auto-scroll on initial load / conversation switch
   * (auto-scroll then only happens while a response is generating).
   */
  scrollOnLoad?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const messages = useThread((s) => s.messages);
  const isRunning = useThread((s) => s.isRunning);
  const isLoadingMessages = useThread((s) => s.isLoadingMessages);

  useScrollToBottom({
    ref,
    lastMessage: messages[messages.length - 1] || { id: "" },
    scrollVariant,
    userMessageSelector,
    isRunning,
    isLoadingMessages,
    scrollOnLoad,
  });

  return (
    <div className="openui-agent-thread-scroll-container">
      <div
        ref={ref}
        className={clsx(
          "openui-agent-thread-scroll-area",
          {
            "openui-agent-thread-scroll-area--user-message-anchor":
              scrollVariant === "user-message-anchor",
          },
          className,
        )}
      >
        {children}
      </div>
      <ScrollToLatest scrollRef={ref} />
    </div>
  );
};

export const AssistantMessageContainer = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={clsx("openui-agent-thread-message-assistant", className)}>
      <div className="openui-agent-thread-message-assistant__content">{children}</div>
    </div>
  );
};

export const UserMessageContainer = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={clsx("openui-agent-thread-message-user", className)}>
      <div className="openui-agent-thread-message-user__content">{children}</div>
    </div>
  );
};

const AssistantMessageContent = ({
  message,
  allMessages,
  isLast,
}: {
  message: AssistantMessage;
  allMessages: Message[];
  isLast: boolean;
}) => {
  // One id-keyed pairing of calls↔results with real status — no positional break,
  // no grouped-not-paired flow, running state from the data.
  const activities = useToolActivities(message, allMessages);

  return (
    <>
      {message.content && (
        <MarkDownRenderer
          textMarkdown={message.content}
          className="openui-agent-thread-message-assistant__text"
        />
      )}
      {activities.map((activity, idx) => (
        <TimelineEntry
          key={activity.id}
          activity={activity}
          isLast={isLast && idx === activities.length - 1}
          detailedViewPanel={DetailedViewPanel}
        />
      ))}
    </>
  );
};

export const RenderMessage = memo(
  ({
    message,
    className,
    allMessages,
    assistantMessage: CustomAssistantMessage,
    userMessage: CustomUserMessage,
    isStreaming,
    isLast,
  }: {
    message: Message;
    className?: string;
    allMessages: Message[];
    assistantMessage?: AssistantMessageComponent;
    userMessage?: UserMessageComponent;
    isStreaming: boolean;
    /** Whether this is the last *assistant* message (drives the running shimmer). */
    isLast: boolean;
  }) => {
    if (message.role === "tool") {
      // Tool messages are rendered inline with their parent assistant message
      return null;
    }

    if (message.role === "assistant") {
      if (CustomAssistantMessage) {
        return <CustomAssistantMessage message={message} isStreaming={isStreaming} />;
      }
      return (
        <AssistantMessageContainer className={className}>
          <AssistantMessageContent message={message} allMessages={allMessages} isLast={isLast} />
        </AssistantMessageContainer>
      );
    }

    if (message.role === "user") {
      if (CustomUserMessage) {
        return <CustomUserMessage message={message} />;
      }
      return (
        <UserMessageContainer className={className}>
          <UserMessageContent message={message} />
        </UserMessageContainer>
      );
    }

    // Other roles (system, developer, reasoning, activity) — skip by default
    return null;
  },
);

export const MessageLoading = () => {
  return (
    <div className="openui-agent-thread-message-loading">
      <DotMatrixLoader variant="compact" />
    </div>
  );
};

export const ThreadError = () => {
  const threadError = useThread((s) => s.threadError);
  if (!threadError) return null;

  return (
    <div className="openui-agent-thread-error">
      <Callout
        variant="danger"
        title="Something went wrong"
        description={threadError.message || "An unexpected error occurred. Please try again."}
      />
    </div>
  );
};

// ─── Interleaved turns (Chain B) ─────────────────────────────────────────────
// Models that narrate between tool calls produce several assistant message
// items in one run. The stream layer now preserves them as separate assistant
// messages (matching reload); here consecutive assistant/tool messages are
// grouped into a TURN so the narration + tool rows collapse into one panel and
// only the final text renders as the answer — instead of one tray per segment.

/**
 * Groups a message list into units: consecutive assistant/tool runs become one
 * turn; every other message stands alone. Pure — same result live and on
 * reload, since both produce the same message sequence.
 */
export function groupIntoTurns(
  messages: Message[],
): { messages: Message[]; startIndex: number }[] {
  const groups: { messages: Message[]; startIndex: number }[] = [];
  let current: { messages: Message[]; startIndex: number } | null = null;
  messages.forEach((message, i) => {
    if (message.role === "assistant" || message.role === "tool") {
      if (!current) {
        current = { messages: [], startIndex: i };
        groups.push(current);
      }
      current.messages.push(message);
    } else {
      current = null;
      groups.push({ messages: [message], startIndex: i });
    }
  });
  return groups;
}

/** One narration segment's rows: muted text + raw tool cards (panel-internal). */
const TurnSegmentRows = ({
  message,
  allMessages,
}: {
  message: AssistantMessage;
  allMessages: Message[];
}) => {
  const activities = useToolActivities(message, allMessages);
  // Narration is prose; strip sentinel wrapping if the backend emitted any.
  const { content } = separateContentAndContext(message.content ?? "");
  return (
    <div className="openui-agent-thread-turn__segment">
      {content && (
        <div className="openui-agent-thread-turn__step">
          <span className="openui-agent-thread-turn__step-icon" aria-hidden>
            <Text size={14} />
          </span>
          <MarkDownRenderer
            textMarkdown={content}
            className="openui-agent-thread-turn__narration"
          />
        </div>
      )}
      {activities.map((activity) => (
        <TimelineEntry
          key={activity.id}
          activity={activity}
          isLast={false}
          detailedViewPanel={DetailedViewPanel}
          forceDefault
        />
      ))}
    </div>
  );
};

/** Matched (artifact/search) renderers stay visible OUTSIDE the collapsible
 *  panel — mirrors GenUIAssistantMessage's raw-in-tray + preview-outside split. */
const TurnSegmentMatched = ({
  message,
  allMessages,
}: {
  message: AssistantMessage;
  allMessages: Message[];
}) => {
  const activities = useToolActivities(message, allMessages);
  const registry = useArtifactRendererRegistry();
  const matched = activities.filter(
    (a) => !!(registry && lookupArtifactRenderer(registry, a.toolName)),
  );
  return (
    <>
      {matched.map((activity) => (
        <TimelineEntry
          key={activity.id}
          activity={activity}
          isLast={false}
          detailedViewPanel={DetailedViewPanel}
          fallbackToDefault={false}
        />
      ))}
    </>
  );
};

const InterleavedTurn = ({
  turnMessages,
  allMessages,
  assistantMessage,
  className,
  isLive,
  isLastTurn,
}: {
  turnMessages: Message[];
  allMessages: Message[];
  assistantMessage?: AssistantMessageComponent;
  className?: string;
  isLive: boolean;
  isLastTurn: boolean;
}) => {
  const segments = turnMessages.filter((m) => m.role === "assistant") as AssistantMessage[];
  const last = segments[segments.length - 1]!;
  // The ANSWER is the segment that closes the turn with pure text. While the
  // latest segment still carries tool calls, the model is mid-work — that
  // segment belongs in the panel too, and rendering it through the assistant
  // component would mount a SECOND tray (two "Working…" pills fighting).
  // Settled turns always surface the last segment so no text is ever lost.
  const lastIsPureText =
    (last.content?.length ?? 0) > 0 && (last.toolCalls?.length ?? 0) === 0;
  const answer = lastIsPureText || !isLive ? last : null;
  const narration = answer ? segments.slice(0, -1) : segments;
  const toolCount = segments.reduce((n, m) => n + (m.toolCalls?.length ?? 0), 0);

  // Open only while the tools are still working: collapses the moment the
  // final answer's first tokens arrive — not when the whole answer finishes.
  // A manual toggle wins until the next live run.
  const answerStarted = !!answer && (answer.content?.length ?? 0) > 0;
  const [userToggled, setUserToggled] = useState<boolean | null>(null);
  const prevLive = useRef(isLive);
  useEffect(() => {
    if (!prevLive.current && isLive) setUserToggled(null);
    prevLive.current = isLive;
  }, [isLive]);
  const open = userToggled ?? (isLive && !answerStarted);

  return (
    <div className="openui-agent-thread-turn">
      <div className="openui-behind-the-scenes">
        <button
          className="openui-behind-the-scenes__toggle"
          type="button"
          aria-expanded={open}
          onClick={() => setUserToggled(!open)}
        >
          {open ? (
            <ChevronUp size={14} className="openui-behind-the-scenes__toggle-icon" />
          ) : (
            <ChevronDown size={14} className="openui-behind-the-scenes__toggle-icon" />
          )}
          {isLive && !answerStarted
            ? "Working..."
            : `${toolCount} tool call${toolCount === 1 ? "" : "s"}`}
        </button>
        {/* Mounted while open OR live so the auto-collapse (answer starts
            streaming) can FADE out instead of vanishing; settled+closed turns
            unmount to keep long threads cheap. */}
        {(open || isLive) && (
          <div
            className={clsx(
              "openui-behind-the-scenes__collapse",
              !open && "openui-behind-the-scenes__collapse--closed",
            )}
          >
            <div className="openui-behind-the-scenes__collapse-inner">
              <div className="openui-behind-the-scenes__items">
                {narration.map((seg) => (
                  <MessageProvider key={seg.id} message={seg}>
                    <TurnSegmentRows message={seg} allMessages={allMessages} />
                  </MessageProvider>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {narration.map((seg) => (
        <MessageProvider key={`${seg.id}-matched`} message={seg}>
          <TurnSegmentMatched message={seg} allMessages={allMessages} />
        </MessageProvider>
      ))}
      {answer && (
        <MessageProvider message={answer}>
          <RenderMessage
            message={answer}
            allMessages={allMessages}
            assistantMessage={assistantMessage}
            isStreaming={isLive}
            isLast={isLastTurn}
            className={className}
          />
        </MessageProvider>
      )}
    </div>
  );
};

/** No visible progress yet: nothing, a fresh user message, or an assistant
 *  ITEM created but still empty (created before its first delta arrives). */
function showLoader(messages: Message[]): boolean {
  const last = messages[messages.length - 1];
  if (!last) return true;
  if (last.role === "user") return true;
  return (
    last.role === "assistant" &&
    ((last as AssistantMessage).content?.length ?? 0) === 0 &&
    ((last as AssistantMessage).toolCalls?.length ?? 0) === 0
  );
}

export const Messages = ({
  className,
  loader,
  assistantMessage,
  userMessage,
}: {
  className?: string;
  loader?: React.ReactNode;
  assistantMessage?: AssistantMessageComponent;
  userMessage?: UserMessageComponent;
}) => {
  const messages = useThread((s) => s.messages);
  const isRunning = useThread((s) => s.isRunning);
  const threadError = useThread((s) => s.threadError);

  // Scan for the last *assistant* message (not the last message index) so the
  // running shimmer survives trailing tool messages.
  let lastAssistantIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === "assistant") {
      lastAssistantIndex = i;
      break;
    }
  }

  const groups = groupIntoTurns(messages);

  return (
    <div className={clsx("openui-agent-thread-messages", className)}>
      {groups.map((group) => {
        const assistantCount = group.messages.filter((m) => m.role === "assistant").length;
        const containsLastAssistant =
          lastAssistantIndex >= group.startIndex &&
          lastAssistantIndex < group.startIndex + group.messages.length;

        // Turn treatment: ≥2 assistant segments (interleaved turn), or a LIVE
        // tool-bearing turn — mounting the panel from the first tool call keeps
        // ONE stable tray across the whole run instead of swapping components
        // when the second segment arrives.
        const hasToolCalls = group.messages.some(
          (m) => m.role === "assistant" && ((m as AssistantMessage).toolCalls?.length ?? 0) > 0,
        );
        if (
          assistantCount >= 2 ||
          (isRunning && containsLastAssistant && assistantCount > 0 && hasToolCalls)
        ) {
          return (
            <InterleavedTurn
              key={group.messages[0]!.id}
              turnMessages={group.messages}
              allMessages={messages}
              assistantMessage={assistantMessage}
              className={className}
              isLive={isRunning && containsLastAssistant}
              isLastTurn={containsLastAssistant}
            />
          );
        }

        // Everything else renders exactly as before, message by message.
        return group.messages.map((message, j) => {
          const i = group.startIndex + j;
          return (
            <MessageProvider key={message.id} message={message}>
              <RenderMessage
                message={message}
                allMessages={messages}
                assistantMessage={assistantMessage}
                userMessage={userMessage}
                isStreaming={isRunning && i === lastAssistantIndex}
                isLast={i === lastAssistantIndex}
              />
            </MessageProvider>
          );
        });
      })}
      {/* Standalone loader ONLY before the run's assistant message has BODY —
          once content or a tool call exists, its own in-message progress
          affordance takes over, and showing both indicators reads as uneven
          double "thinking" states. The empty-shell check matters: the
          assistant message ITEM is created before its first delta, and hiding
          the loader on creation leaves a visible dead gap until the turn
          panel / text mounts. (Whatever renders last also inherits the
          user-message-anchor min-height spacer from thread.scss, so hiding
          the loader here does not collapse the anchored scroll position.) */}
      {isRunning && showLoader(messages) && (
        <div className="openui-agent-thread-loader">{loader}</div>
      )}
      {!isRunning && threadError && <ThreadError />}
    </div>
  );
};

export const ThreadHeader = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={clsx("openui-agent-thread-header", className)}>
      <div className="openui-agent-thread-header__title">{/* Thread title hidden for now. */}</div>
      <div className="openui-agent-thread-header__actions">
        {children}
        <WorkspaceToggleButton />
      </div>
    </div>
  );
};

const WorkspaceToggleButton = () => {
  const artifacts = useArtifactList();
  const { isDetailedViewActive } = useActiveDetailedView();
  const { workspaceToggle } = useAgentInterfaceLabels();
  const { isWorkspaceOpen, setIsWorkspaceOpen } = useAgentInterfaceStore((state) => ({
    isWorkspaceOpen: state.isWorkspaceOpen,
    setIsWorkspaceOpen: state.setIsWorkspaceOpen,
  }));
  const hasArtifacts = Object.keys(artifacts).length > 0;

  if (!hasArtifacts || isDetailedViewActive) return null;

  return (
    <AgentInterfaceTooltip content={workspaceToggle} side="left">
      <IconButton
        icon={<GalleryHorizontalEndIcon size="1em" />}
        onClick={() => {
          if (hasArtifacts) setIsWorkspaceOpen(!isWorkspaceOpen);
        }}
        size="small"
        variant="tertiary"
        aria-label={isWorkspaceOpen ? "Collapse workspace" : "Expand workspace"}
        className="openui-agent-thread-header__workspace-toggle-button"
      />
    </AgentInterfaceTooltip>
  );
};

// Re-export Composer from components
export { Composer } from "./components";
