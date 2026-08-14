"use client";

import {
  AuiIf,
  ComposerPrimitive,
  MessagePrimitive,
  SuggestionPrimitive,
  ThreadPrimitive,
  useAuiState,
  type AssistantState,
} from "@assistant-ui/react";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, SquareIcon } from "lucide-react";

const isNewChatView = (state: AssistantState) =>
  state.thread.messages.length === 0 && (!state.thread.isLoading || state.threads.isLoading);

export function Thread() {
  const isEmpty = useAuiState(isNewChatView);

  return (
    <ThreadPrimitive.Root
      className="aui-root aui-thread-root @container flex h-full flex-col bg-background"
      style={{
        ["--thread-max-width" as string]: "44rem",
        ["--composer-bg" as string]:
          "color-mix(in oklab, var(--color-muted) 30%, var(--color-background))",
        ["--composer-radius" as string]: "1.5rem",
        ["--composer-padding" as string]: "8px",
      }}
    >
      <ThreadPrimitive.Viewport
        turnAnchor="top"
        className="relative flex flex-1 flex-col overflow-x-auto overflow-y-scroll scroll-smooth"
      >
        <div
          className={`mx-auto flex w-full max-w-(--thread-max-width) flex-1 flex-col px-4 pt-4 ${
            isEmpty ? "justify-center" : ""
          }`}
        >
          <AuiIf condition={isNewChatView}>
            <ThreadWelcome />
          </AuiIf>

          <div className="mb-14 flex flex-col gap-y-6 empty:hidden">
            <ThreadPrimitive.Messages
              components={{
                UserMessage,
                AssistantMessage,
              }}
            />
          </div>

          <ThreadPrimitive.ViewportFooter
            className={`flex flex-col gap-4 overflow-visible bg-background pb-4 md:pb-6 ${
              isEmpty ? "" : "sticky bottom-0 mt-auto rounded-t-(--composer-radius)"
            }`}
          >
            <ThreadScrollToBottom />
            <Composer />
            <AuiIf condition={(state) => isNewChatView(state) && state.composer.isEmpty}>
              <ThreadSuggestions />
            </AuiIf>
          </ThreadPrimitive.ViewportFooter>
        </div>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
}

function ThreadWelcome() {
  return (
    <div className="mb-6 flex flex-col items-center px-4 text-center">
      <h1 className="text-2xl font-semibold">How can I help you today?</h1>
    </div>
  );
}

function ThreadSuggestions() {
  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-2 px-4">
      <ThreadPrimitive.Suggestions>
        {() => (
          <SuggestionPrimitive.Trigger
            send
            className="inline-flex h-auto items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-border/60 px-3.5 py-1.5 text-sm font-normal text-foreground transition-colors hover:bg-muted"
          >
            <SuggestionPrimitive.Title />
            <SuggestionPrimitive.Description />
          </SuggestionPrimitive.Trigger>
        )}
      </ThreadPrimitive.Suggestions>
    </div>
  );
}

function ThreadScrollToBottom() {
  return (
    <ThreadPrimitive.ScrollToBottom className="absolute -top-12 z-10 self-center rounded-full border border-border bg-background p-3 text-foreground shadow-sm disabled:invisible">
      <ArrowDownIcon className="size-4" />
      <span className="sr-only">Scroll to bottom</span>
    </ThreadPrimitive.ScrollToBottom>
  );
}

function Composer() {
  return (
    <ComposerPrimitive.Root className="relative flex w-full flex-col">
      <ComposerPrimitive.AttachmentDropzone asChild>
        <div className="flex w-full flex-col gap-2 rounded-(--composer-radius) border border-border/60 bg-(--composer-bg) p-(--composer-padding) shadow-[0_4px_16px_-8px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow] focus-within:border-border focus-within:shadow-[0_6px_24px_-8px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.05)] data-[dragging=true]:border-dashed data-[dragging=true]:border-ring">
          <ComposerPrimitive.Input
            placeholder="Send a message..."
            className="max-h-32 min-h-10 w-full resize-none bg-transparent px-2.5 py-1 text-base outline-none placeholder:text-muted-foreground/80"
            rows={1}
            autoFocus
            enterKeyHint="send"
            aria-label="Message input"
          />
          <div className="relative flex items-center justify-between">
            <ComposerPrimitive.AddAttachment className="flex size-7 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent disabled:opacity-50">
              <PlusIcon className="size-4" />
              <span className="sr-only">Add Attachment</span>
            </ComposerPrimitive.AddAttachment>
            <AuiIf condition={(state) => !state.thread.isRunning}>
              <ComposerPrimitive.Send className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-50">
                <ArrowUpIcon className="size-4.5" />
                <span className="sr-only">Send message</span>
              </ComposerPrimitive.Send>
            </AuiIf>
            <AuiIf condition={(state) => state.thread.isRunning}>
              <ComposerPrimitive.Cancel className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <SquareIcon className="size-3.5 fill-current" />
                <span className="sr-only">Stop generating</span>
              </ComposerPrimitive.Cancel>
            </AuiIf>
          </div>
        </div>
      </ComposerPrimitive.AttachmentDropzone>
    </ComposerPrimitive.Root>
  );
}

function UserMessage() {
  return (
    <MessagePrimitive.Root className="grid auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] content-start gap-y-2 px-2 [&:where(>*)]:col-start-2">
      <div className="relative col-start-2 min-w-0">
        <div className="rounded-xl bg-muted px-4 py-2 text-foreground wrap-break-word empty:hidden">
          <MessagePrimitive.Content />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="relative px-2 pb-1">
      <div className="text-foreground leading-relaxed wrap-break-word">
        <MessagePrimitive.Content />
      </div>
    </MessagePrimitive.Root>
  );
}
