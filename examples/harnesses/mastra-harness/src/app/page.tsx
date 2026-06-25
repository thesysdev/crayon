"use client";

import { useTheme } from "@/hooks/use-system-theme";
import {
  createMastraHarnessChatProps,
  type HarnessModeId,
} from "@/lib/mastra-harness-chat";
import { agUIAdapter } from "@openuidev/react-headless";
import { FullScreen, IconButton } from "@openuidev/react-ui";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import { ArrowUp, Check, ChevronDown, Square } from "lucide-react";
import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";

const HARNESS_MODES: Array<{ description: string; id: HarnessModeId; label: string }> = [
  {
    description: "Full UI answer with tools, tables, sections, and follow-ups.",
    id: "assist",
    label: "Assist",
  },
  {
    description: "Tiny executive brief with key point, risk, and next action.",
    id: "brief",
    label: "Brief",
  },
];

let currentHarnessMode: HarnessModeId = "assist";

function getCurrentHarnessMode(): HarnessModeId {
  return currentHarnessMode;
}

function ModePicker({
  mode,
  onModeChange,
}: {
  mode: HarnessModeId;
  onModeChange: (mode: HarnessModeId) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const selectedMode = HARNESS_MODES.find((option) => option.id === mode) ?? HARNESS_MODES[0];

  const selectMode = (nextMode: HarnessModeId) => {
    onModeChange(nextMode);
    setIsOpen(false);
  };

  return (
    <div
      className="mastra-mode-picker"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Mode: ${selectedMode.label}. ${selectedMode.description}`}
        className="mastra-mode-picker__trigger"
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setIsOpen(true);
          }
          if (event.key === "Escape") {
            setIsOpen(false);
          }
        }}
        type="button"
      >
        <span className="mastra-mode-picker__eyebrow">Mode</span>
        <span className="mastra-mode-picker__value">{selectedMode.label}</span>
        <ChevronDown aria-hidden="true" className="mastra-mode-picker__chevron" size={14} />
      </button>
      {isOpen && (
        <div className="mastra-mode-picker__menu" id={menuId} role="listbox" aria-label="Agent mode">
          <div className="mastra-mode-picker__menu-label">Mode</div>
          {HARNESS_MODES.map((option) => (
            <button
              aria-selected={mode === option.id}
              className="mastra-mode-picker__option"
              data-active={mode === option.id ? "true" : undefined}
              key={option.id}
              onClick={() => selectMode(option.id)}
              role="option"
              type="button"
            >
              <span className="mastra-mode-picker__option-copy">
                <span className="mastra-mode-picker__option-name">{option.label}</span>
                <span className="mastra-mode-picker__option-description">
                  {option.description}
                </span>
              </span>
              {mode === option.id && (
                <Check aria-hidden="true" className="mastra-mode-picker__option-check" size={14} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MastraModeComposer({
  onSend,
  onCancel,
  isRunning,
  isLoadingMessages,
}: {
  onSend: (message: string) => void;
  onCancel: () => void;
  isRunning: boolean;
  isLoadingMessages: boolean;
}) {
  const [textContent, setTextContent] = useState("");
  const [mode, setMode] = useState<HarnessModeId>(currentHarnessMode);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleModeChange = (nextMode: HarnessModeId) => {
    currentHarnessMode = nextMode;
    setMode(nextMode);
  };

  const handleSubmit = () => {
    const message = textContent.trim();
    if (!message || isRunning || isLoadingMessages) return;

    onSend(message);
    setTextContent("");
  };

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    input.style.height = "0px";
    input.style.height = `${Math.max(input.scrollHeight, 24)}px`;
  }, [textContent]);

  return (
    <div
      className="openui-shell-thread-composer mastra-harness-composer"
      data-drafting={textContent.length > 0 || undefined}
      onClick={(event) => {
        if (!(event.target as HTMLElement).closest("button, a, [role='button']")) {
          inputRef.current?.focus();
        }
      }}
    >
      <div className="openui-shell-thread-composer__input-wrapper">
        <textarea
          ref={inputRef}
          value={textContent}
          onChange={(event) => setTextContent(event.target.value)}
          className="openui-shell-thread-composer__input"
          placeholder="Type your query here"
          rows={1}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSubmit();
            }
          }}
        />
        <div className="openui-shell-thread-composer__action-bar">
          <ModePicker mode={mode} onModeChange={handleModeChange} />
          <IconButton
            onClick={isRunning ? onCancel : handleSubmit}
            icon={isRunning ? <Square size="1em" fill="currentColor" /> : <ArrowUp size="1em" />}
            size="extra-small"
            variant="primary"
            aria-label={isRunning ? "Cancel message" : "Send message"}
            className="openui-shell-thread-composer__submit-button"
          />
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const themeMode = useTheme();
  const chatProps = useMemo(
    () =>
      createMastraHarnessChatProps({
        getModeId: getCurrentHarnessMode,
      }),
    [],
  );

  return (
    <div className="app-shell">
      <FullScreen
        {...chatProps}
        streamProtocol={agUIAdapter()}
        componentLibrary={openuiChatLibrary}
        agentName="Mastra Harness + OpenUI"
        theme={{ mode: themeMode }}
        composer={MastraModeComposer}
        conversationStarters={{
          variant: "short",
          options: [
            {
              displayText: "Market brief",
              prompt: "Use the stock tool and build a concise market brief for AAPL and NVDA.",
            },
            {
              displayText: "Trip weather",
              prompt: "Compare the current weather in Tokyo, London, and Mumbai.",
            },
            {
              displayText: "Launch plan",
              prompt:
                "Create a launch plan for a new AI feature with risks, owners, and follow-up actions.",
            },
            {
              displayText: "Status dashboard",
              prompt:
                "Turn this into a product status dashboard: auth migration is 70% done, billing API is blocked, docs are ready.",
            },
          ],
        }}
      />
    </div>
  );
}
