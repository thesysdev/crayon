"use client";

import { AuiIf, ComposerPrimitive, MessagePrimitive, ThreadPrimitive } from "@assistant-ui/react";
import { ArrowUp, Square } from "lucide-react";

const starters = [
  {
    label: "Trip summary with follow-ups",
    prompt:
      "Show a trip summary for my Tokyo trip: flying March 14 to 21, staying at Park Hyatt Tokyo at $310 a night, total budget $4,200, with three confirmed activities: teamLab Planets, a Tsukiji food tour, and a Hakone day trip. Use present_openui and end with a FollowUpBlock offering to plan the first day or review the budget.",
  },
  {
    label: "Interactive meeting choice",
    prompt:
      "Use prompt_openui to ask me to pick a meeting slot from Tuesday 10:00, Wednesday 14:30, or Friday 09:15.",
  },
];

export function Thread() {
  return (
    <ThreadPrimitive.Root className="flex h-full min-w-0 flex-col bg-[var(--background)]">
      <header className="border-b border-[var(--border)] px-5 py-4">
        <p className="font-medium">assistant-ui + OpenUI</p>
        <p className="text-sm text-[var(--muted-foreground)]">
          Running against the local OpenUI workspace packages
        </p>
      </header>

      <ThreadPrimitive.Viewport className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <ThreadPrimitive.Empty>
          <div className="flex flex-1 items-center justify-center p-6 text-center">
            <div className="w-full max-w-2xl">
              <h1 className="text-2xl font-semibold">Test the OpenUI integration</h1>
              <p className="mt-2 text-[var(--muted-foreground)]">
                Generate a display card with follow-ups, then click one to start the next turn.
              </p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {starters.map(({ label, prompt }) => (
                  <ThreadPrimitive.Suggestion key={label} prompt={prompt} asChild>
                    <button className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-left text-sm hover:bg-[var(--muted)]">
                      {label}
                    </button>
                  </ThreadPrimitive.Suggestion>
                ))}
              </div>
            </div>
          </div>
        </ThreadPrimitive.Empty>

        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            AssistantMessage,
          }}
        />

        <ThreadPrimitive.ViewportFooter className="sticky bottom-0 mt-auto w-full bg-[var(--background)] p-4">
          <ComposerPrimitive.Root className="mx-auto flex w-full max-w-2xl items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--muted)] p-2">
            <ComposerPrimitive.Input asChild>
              <textarea
                aria-label="Message"
                placeholder="Ask anything..."
                rows={1}
                className="field-sizing-content max-h-32 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-3 py-2 outline-none"
              />
            </ComposerPrimitive.Input>
            <AuiIf condition={(state) => !state.thread.isRunning}>
              <ComposerPrimitive.Send className="flex size-10 items-center justify-center rounded-xl bg-[var(--foreground)] text-[var(--background)] disabled:opacity-40">
                <ArrowUp className="size-4" />
                <span className="sr-only">Send message</span>
              </ComposerPrimitive.Send>
            </AuiIf>
            <AuiIf condition={(state) => state.thread.isRunning}>
              <ComposerPrimitive.Cancel className="flex size-10 items-center justify-center rounded-xl bg-[var(--foreground)] text-[var(--background)]">
                <Square className="size-3.5" fill="currentColor" />
                <span className="sr-only">Stop generating</span>
              </ComposerPrimitive.Cancel>
            </AuiIf>
          </ComposerPrimitive.Root>
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
}

function UserMessage() {
  return (
    <MessagePrimitive.Root className="mx-auto flex w-full max-w-2xl justify-end px-4 py-2">
      <div className="max-w-[80%] rounded-2xl bg-[var(--muted)] px-4 py-3">
        <MessagePrimitive.Content />
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="mx-auto w-full max-w-2xl px-4 py-3 leading-7">
      <MessagePrimitive.Content />
    </MessagePrimitive.Root>
  );
}
