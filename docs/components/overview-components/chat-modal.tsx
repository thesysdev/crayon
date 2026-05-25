"use client";

import "@openuidev/react-ui/components.css";
import "./chat-modal.css";

import {
  EventType,
  openAIMessageFormat,
  type AGUIEvent,
  type StreamProtocolAdapter,
} from "@openuidev/react-headless";
import { FullScreen } from "@openuidev/react-ui";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import { X } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { DemoCreditsDialog } from "@/components/DemoCreditsDialog";
import { isDemoCreditsErrorPayload } from "@/lib/demo-credits";

interface ChatModalProps {
  onClose: () => void;
}

function demoAwareOpenAIAdapter(onCreditsExhausted: () => void): StreamProtocolAdapter {
  // This intentionally mirrors @openuidev/react-headless's openAIAdapter parser so the
  // docs demo can intercept structured credit errors that arrive as SSE data frames.
  // If that adapter gains an error callback, replace this fork with the upstream API.
  return {
    async *parse(response: Response): AsyncIterable<AGUIEvent> {
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      const messageId = crypto.randomUUID();
      const toolCallIds: Record<number, string> = {};
      let messageStarted = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (!data || data === "[DONE]") continue;

          try {
            const json = JSON.parse(data) as {
              error?: unknown;
              choices?: Array<{
                delta?: {
                  content?: string;
                  role?: string;
                  tool_calls?: Array<{
                    index: number;
                    id?: string;
                    function?: { name?: string; arguments?: string };
                  }>;
                };
                finish_reason?: string;
              }>;
            };

            if (isDemoCreditsErrorPayload(json.error)) {
              onCreditsExhausted();
              await reader.cancel().catch(() => undefined);
              return;
            }

            const choice = json.choices?.[0];
            const delta = choice?.delta;

            if (!delta) continue;

            if (!messageStarted && (delta.content || delta.role)) {
              yield {
                type: EventType.TEXT_MESSAGE_START,
                messageId,
                role: "assistant",
              };
              messageStarted = true;
            }

            if (delta.content) {
              yield {
                type: EventType.TEXT_MESSAGE_CONTENT,
                messageId,
                delta: delta.content,
              };
            }

            if (delta.tool_calls) {
              for (const toolCall of delta.tool_calls) {
                const index = toolCall.index;

                if (toolCall.id) {
                  toolCallIds[index] = toolCall.id;
                  yield {
                    type: EventType.TOOL_CALL_START,
                    toolCallId: toolCall.id,
                    toolCallName: toolCall.function?.name || "",
                  };
                }

                if (toolCall.function?.arguments) {
                  const toolCallId = toolCallIds[index];
                  if (toolCallId) {
                    yield {
                      type: EventType.TOOL_CALL_ARGS,
                      toolCallId,
                      delta: toolCall.function.arguments,
                    };
                  }
                }
              }
            }

            if (choice?.finish_reason === "stop") {
              yield {
                type: EventType.TEXT_MESSAGE_END,
                messageId,
              };
            } else if (choice?.finish_reason === "tool_calls") {
              for (const toolCallId of Object.values(toolCallIds)) {
                yield {
                  type: EventType.TOOL_CALL_END,
                  toolCallId,
                };
              }
            }
          } catch (error) {
            console.error("Failed to parse OpenAI SSE event", error);
          }
        }
      }
    },
  };
}

export function ChatModal({ onClose }: ChatModalProps) {
  const { resolvedTheme } = useTheme();
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const streamProtocol = useMemo(
    () => demoAwareOpenAIAdapter(() => setShowCreditsDialog(true)),
    [],
  );

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  return createPortal(
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="chat-modal-close" onClick={onClose} aria-label="Close chat">
          <X size={20} />
        </button>
        <div className="chat-modal-body">
          <FullScreen
            welcomeMessage={{ title: "Hello, how can I help you today?" }}
            processMessage={async ({ messages, abortController }) => {
              const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  messages: openAIMessageFormat.toApi(messages),
                }),
                signal: abortController.signal,
              });

              if (!response.ok) {
                const err = await response.clone().json().catch(() => ({}));
                if (isDemoCreditsErrorPayload((err as { error?: unknown }).error)) {
                  setShowCreditsDialog(true);
                  return new Response("data: [DONE]\n\n", {
                    headers: { "Content-Type": "text/event-stream" },
                  });
                }
              }

              return response;
            }}
            streamProtocol={streamProtocol}
            componentLibrary={openuiChatLibrary}
            agentName="OpenUI Chat"
            theme={{ mode: (resolvedTheme as "light" | "dark") ?? "light" }}
            conversationStarters={{
              variant: "short",
              options: [
                {
                  displayText: "Revenue dashboard",
                  prompt:
                    "Build a revenue dashboard with a bar chart showing monthly revenue for Q4, key metrics, and a summary table.",
                },
                {
                  displayText: "Signup form",
                  prompt:
                    "Create a user registration form with name, email, password, and country fields with validation.",
                },
                {
                  displayText: "Compare React vs Vue",
                  prompt:
                    "Show me a comparison of React and Vue frameworks using tabs with pros, cons, and a feature comparison table.",
                },
                {
                  displayText: "Travel destinations",
                  prompt:
                    "Show me a carousel of 3 popular travel destinations with images, descriptions, and best time to visit.",
                },
              ],
            }}
          />
        </div>
        <DemoCreditsDialog
          open={showCreditsDialog}
          onClose={() => setShowCreditsDialog(false)}
        />
      </div>
    </div>,
    document.body,
  );
}
