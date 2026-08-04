import type { AssistantMessage, Message } from "@openuidev/react-headless";
import {
  MessageProvider,
  useActiveDetailedView,
  useArtifactList,
  useArtifactRendererRegistry,
  useThread,
  useToolActivities,
} from "@openuidev/react-headless";
import clsx from "clsx";
import React, { memo, useId, useMemo, useRef } from "react";
import { useLayoutContext } from "../../context/LayoutContext";
import { ScrollVariant, useScrollToBottom } from "../../hooks/useScrollToBottom";
import { getLastAssistantMessageId, getMatchedRendererActivities } from "../../utils/messages";
import { hasLangSyntax, separateContentAndContext } from "../../utils/sentinelParser";
import { ToolCallTimeline, type TimelineStep } from "../ToolCall";
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

/**
 * Groups a message list into turns: a run of consecutive assistant/tool
 * messages (thinking, tool calls, results, answer) becomes ONE group; every
 * other message (user, system, …) stands alone. `startIndex` is the group's
 * position in the original list.
 */
function groupIntoTurns(messages: Message[]): { messages: Message[]; startIndex: number }[] {
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

/**
 * A whole turn (its merged tool timeline + final answer) as one unit. Owned
 * here rather than per-message so the tray is a single element keyed by the
 * turn's first segment ({@link Messages}) — it mounts once and only updates as
 * segments stream in, instead of hopping between segments and resetting its
 * reveal state. Earlier segments live in the tray; the answer renders through
 * the assistant component.
 */
const InterleavedTurn = ({
  segments,
  allMessages,
  assistantMessage: CustomAssistantMessage,
  className,
  isRunning,
  lastAssistantId,
}: {
  segments: AssistantMessage[];
  allMessages: Message[];
  assistantMessage?: AssistantMessageComponent;
  className?: string;
  isRunning: boolean;
  lastAssistantId: string | null;
}) => {
  const last = segments[segments.length - 1]!;
  const turnLive = isRunning && lastAssistantId === last.id;

  const lastContent = separateContentAndContext(last.content ?? "").content;
  const answer = !turnLive || hasLangSyntax(lastContent) ? last : null;

  // One id-keyed pairing across every segment's tool calls (synthetic message).
  const turnMessage = useMemo(
    () => ({ ...segments[0]!, toolCalls: segments.flatMap((s) => s.toolCalls ?? []) }),
    [segments],
  );
  const turnActivities = useToolActivities(turnMessage, allMessages);

  // Rows in run order: each non-answer segment's thinking prose, then its tools.
  const steps = useMemo<TimelineStep[]>(() => {
    const byCallId = new Map(turnActivities.map((a) => [a.toolCall.id, a]));
    const rows: TimelineStep[] = [];
    for (const seg of segments) {
      if (seg.id !== answer?.id) {
        const prose = separateContentAndContext(seg.content ?? "").content;
        if (prose) rows.push({ type: "text", id: seg.id, text: prose });
      }
      for (const tc of seg.toolCalls ?? []) {
        const activity = byCallId.get(tc.id);
        if (activity) rows.push({ type: "activity", activity });
      }
    }
    return rows;
  }, [segments, turnActivities, answer?.id]);

  // Matched renderers (artifact/search previews) render OUTSIDE the tray so
  // they stay visible after it collapses.
  const registry = useArtifactRendererRegistry();
  const matched = getMatchedRendererActivities(registry, turnActivities);

  // Hold the tray open until the answer's first tokens arrive. `answer` is
  // `last` or null, so reuse the already-parsed `lastContent`.
  const answerStarted = !!answer && lastContent.length > 0;

  return (
    <>
      {turnActivities.length > 0 && (
        <ToolCallTimeline
          activities={turnActivities}
          steps={steps}
          isLast={turnLive}
          forceDefault
          awaitingResponse={turnLive && !answerStarted}
        />
      )}
      {matched.map((activity) => (
        <TimelineEntry
          key={activity.id}
          activity={activity}
          isLast={turnLive}
          fallbackToDefault={false}
        />
      ))}
      {answer && (
        <MessageProvider key={answer.id} message={answer}>
          {CustomAssistantMessage ? (
            <CustomAssistantMessage
              message={answer}
              isStreaming={isRunning && lastAssistantId === answer.id}
            />
          ) : (
            <AssistantMessageContainer className={className}>
              <AssistantMessageContent
                message={answer}
                allMessages={allMessages}
                isLast={isRunning && lastAssistantId === answer.id}
              />
            </AssistantMessageContainer>
          )}
        </MessageProvider>
      )}
    </>
  );
};

/**
 * Renders one turn (a group from {@link groupIntoTurns}).
 *
 * A multi-segment run — or a live tool-bearing run (its panel mounts from the
 * first tool call so it stays ONE stable element as later segments arrive) —
 * renders through {@link InterleavedTurn}. Everything else renders message by
 * message. Turn treatment needs a custom assistant component (the default
 * renderer has no merged-turn notion).
 */
const RenderGroup = ({
  group,
  allMessages,
  assistantMessage: CustomAssistantMessage,
  userMessage,
  className,
  isRunning,
  lastAssistantId,
}: {
  group: Message[];
  allMessages: Message[];
  assistantMessage?: AssistantMessageComponent;
  userMessage?: UserMessageComponent;
  className?: string;
  isRunning: boolean;
  lastAssistantId: string | null;
}) => {
  const assistants = group.filter((m): m is AssistantMessage => m.role === "assistant");
  const containsLast = !!lastAssistantId && assistants.some((m) => m.id === lastAssistantId);
  const hasToolCalls = assistants.some((m) => (m.toolCalls?.length ?? 0) > 0);

  if (
    CustomAssistantMessage &&
    assistants.length > 0 &&
    (assistants.length >= 2 || (isRunning && containsLast && hasToolCalls))
  ) {
    return (
      <InterleavedTurn
        segments={assistants}
        allMessages={allMessages}
        assistantMessage={CustomAssistantMessage}
        className={className}
        isRunning={isRunning}
        lastAssistantId={lastAssistantId}
      />
    );
  }

  return (
    <>
      {group.map((message) => (
        <MessageProvider key={message.id} message={message}>
          <RenderMessage
            message={message}
            allMessages={allMessages}
            assistantMessage={CustomAssistantMessage}
            userMessage={userMessage}
            isStreaming={isRunning && message.id === lastAssistantId}
            isLast={message.id === lastAssistantId}
            className={className}
          />
        </MessageProvider>
      ))}
    </>
  );
};

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

  // Group the flat message list into turns ONCE per change; the arrays keep
  // their identity across unrelated re-renders.
  const groups = useMemo(() => groupIntoTurns(messages), [messages]);

  // Id of the last *assistant* message (not the last message) so the running
  // shimmer survives trailing tool messages.
  const lastAssistantId = useMemo(() => getLastAssistantMessageId(messages), [messages]);

  return (
    <div className={clsx("openui-agent-thread-messages", className)}>
      {groups.map((group) => (
        <RenderGroup
          key={group.messages[0]!.id}
          group={group.messages}
          allMessages={messages}
          assistantMessage={assistantMessage}
          userMessage={userMessage}
          className={className}
          isRunning={isRunning}
          lastAssistantId={lastAssistantId}
        />
      ))}
      {isRunning && <div>{loader}</div>}
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
