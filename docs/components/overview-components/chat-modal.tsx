"use client";

// NOTE: do not import react-ui CSS here. It is loaded once, app-wide, via
// docs/app/global.css. A second react-ui CSS import makes the bundler hoist a
// statement-less `@layer openui` chunk that loads BEFORE global.css's `@layer`
// order declaration, which breaks the cascade order (Tailwind preflight wins).
import "./chat-modal.css";

import { DemoCreditsDialog } from "@/components/DemoCreditsDialog";
import { isDemoCreditsErrorPayload } from "@/lib/demo-credits";
import {
  AgentInterface,
  openAIAdapter,
  openAIMessageFormat,
  type ChatLLM,
} from "@openuidev/react-ui";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import { X } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

interface ChatModalProps {
  onClose: () => void;
}

export function ChatModal({ onClose }: ChatModalProps) {
  const { resolvedTheme } = useTheme();
  const [showOverviewCreditsDialog, setShowOverviewCreditsDialog] = useState(false);

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

  // The backend call — including the demo-credits error handling — is unchanged;
  // only the chat surface moved from FullScreen to AgentInterface. AgentInterface
  // uses its built-in in-memory thread storage (wiped on reload).
  const llm = useMemo<ChatLLM>(
    () => ({
      send: async ({ messages, signal }) => {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: openAIMessageFormat.toApi(messages),
          }),
          signal,
        });

        if (!response.ok) {
          const err = await response
            .clone()
            .json()
            .catch(() => ({}));
          if (isDemoCreditsErrorPayload((err as { error?: unknown }).error)) {
            setShowOverviewCreditsDialog(true);
            return new Response("data: [DONE]\n\n", {
              headers: { "Content-Type": "text/event-stream" },
            });
          }
        }

        return response;
      },
      streamProtocol: openAIAdapter(),
    }),
    [],
  );

  return createPortal(
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="chat-modal-close" onClick={onClose} aria-label="Close chat">
          <X size={20} />
        </button>
        <div className="chat-modal-body">
          <AgentInterface
            llm={llm}
            componentLibrary={openuiChatLibrary}
            agentName="OpenUI Chat"
            theme={{ mode: (resolvedTheme as "light" | "dark") ?? "light" }}
            starterVariant="short"
            starters={[
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
            ]}
          >
            <AgentInterface.Welcome title="Hello, how can I help you today?" />
          </AgentInterface>
        </div>
        <DemoCreditsDialog
          open={showOverviewCreditsDialog}
          onClose={() => setShowOverviewCreditsDialog(false)}
        />
      </div>
    </div>,
    document.body,
  );
}
