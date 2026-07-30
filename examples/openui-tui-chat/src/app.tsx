import type { Message } from "@openuidev/react-headless";
import { Box, Static, Text, useFocus, useInput, type DOMElement } from "ink";
import { useEffect, useRef, useState } from "react";
import { useLocalChat, type ProcessFn } from "./chat.js";
import { RenderValue } from "./genui/components.js";
import { TuiProvider } from "./genui/context.js";
import { tuiLibrary } from "./genui/library.js";
import { isTypedText, MouseProvider } from "./genui/mouse.js";
import { useGenUi } from "./genui/state.js";

function messageText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((p) => (p && typeof p === "object" && "text" in p ? String((p as { text: unknown }).text) : ""))
      .join("");
  }
  return "";
}

const firstLine = (s: string) => s.split("\n")[0] ?? "";

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

// ─────────────────────────── chrome ───────────────────────────

function Header() {
  return (
    <Box marginBottom={1}>
      <Text backgroundColor="green" color="black" bold>
        {" ◆ OpenUI TUI Chat "}
      </Text>
      <Text dimColor>{"  generative UI, streamed into your terminal"}</Text>
    </Box>
  );
}

function Welcome() {
  return (
    <Box flexDirection="column" marginY={1}>
      <Text>Ask for UI and it renders live, right here in your terminal. Try:</Text>
      <Text dimColor> · Compare the 4 largest countries by population as a bar chart</Text>
      <Text dimColor> · Build a contact form with a name field and a topic dropdown</Text>
      <Text dimColor> · Show the top 5 programming languages by popularity in a table</Text>
    </Box>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <Box marginTop={1}>
      <Box borderStyle="round" borderColor="cyan" paddingX={1}>
        <Text color="cyan">{text}</Text>
      </Box>
    </Box>
  );
}

function Thinking() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFrame((f) => (f + 1) % SPINNER.length), 90);
    return () => clearInterval(t);
  }, []);
  return (
    <Box marginTop={1}>
      <Text color="cyan">{SPINNER[frame]} </Text>
      <Text dimColor>OpenUI is thinking…</Text>
    </Box>
  );
}

function Composer({
  draft,
  focused,
  isRunning,
}: {
  draft: string;
  focused: boolean;
  isRunning: boolean;
}) {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box borderStyle="round" borderColor={focused ? "green" : "gray"} paddingX={1}>
        <Text color={focused ? "green" : "gray"}>{"❯ "}</Text>
        <Text>{draft}</Text>
        {focused ? <Text color="green">▏</Text> : null}
        {draft.length === 0 ? (
          <Text dimColor>{isRunning ? "waiting for response…" : "Message OpenUI…"}</Text>
        ) : null}
      </Box>
      <Text dimColor>{"  Enter send · Tab focus UI · ↑↓ choose · Ctrl+C quit"}</Text>
    </Box>
  );
}

// ─────────────────────────── assistant message ───────────────────────────

function AssistantMessageView({
  message,
  interactive,
  isStreaming,
  onSend,
}: {
  message: Message;
  interactive: boolean;
  isStreaming: boolean;
  onSend: (content: string) => void;
}) {
  const content = messageText(message.content);
  const { result, ctx } = useGenUi(
    tuiLibrary,
    message.id,
    content,
    isStreaming,
    onSend,
    interactive,
  );

  if (!result?.root) {
    if (isStreaming) return null;
    return (
      <Box marginTop={1}>
        <Text dimColor>{content ? content : "(no renderable UI)"}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text color="green" bold>
        ◆ OpenUI
      </Text>
      <TuiProvider value={ctx}>
        <RenderValue value={result.root} />
      </TuiProvider>
    </Box>
  );
}

// ─────────────────────────── app ───────────────────────────

type StaticItem = { kind: "header" } | { kind: "message"; message: Message };

export function App({ processMessage }: { processMessage: ProcessFn }) {
  const { messages, isRunning, send } = useLocalChat(processMessage);
  const [draft, setDraft] = useState("");
  const dynamicRef = useRef<DOMElement>(null);

  const { isFocused: composerFocused } = useFocus({ id: "composer", autoFocus: true });
  useInput(
    (input, key) => {
      if (key.return) {
        const text = draft.trim();
        if (text && !isRunning) {
          send(text);
          setDraft("");
        }
        return;
      }
      if (key.backspace || key.delete) {
        setDraft((d) => d.slice(0, -1));
        return;
      }
      // Accept printable text but drop escape/mouse sequences that share stdin
      // when mouse tracking is enabled.
      if (isTypedText(input) && !key.ctrl && !key.meta) {
        setDraft((d) => d + input);
      }
    },
    { isActive: composerFocused },
  );

  const last = messages[messages.length - 1];
  const liveAssistant = last && last.role === "assistant" ? last : null;
  const finalized = liveAssistant ? messages.slice(0, -1) : messages;
  const liveContent = liveAssistant ? messageText(liveAssistant.content) : "";
  const showThinking = isRunning && liveContent.trim() === "";

  // Completed turns are emitted once into scrollback via <Static>, keeping the
  // live/interactive region small so the composer never scrolls off screen.
  const staticItems: StaticItem[] = [
    { kind: "header" },
    ...finalized.map((message) => ({ kind: "message" as const, message })),
  ];

  return (
    <MouseProvider rootRef={dynamicRef}>
      <Box flexDirection="column">
        <Static items={staticItems}>
          {(item, index) =>
            item.kind === "header" ? (
              <Box key="header" paddingX={1}>
                <Header />
              </Box>
            ) : (
              <Box key={item.message.id ?? index} paddingX={1}>
                {item.message.role === "user" ? (
                  <UserBubble text={firstLine(messageText(item.message.content))} />
                ) : (
                  <AssistantMessageView
                    message={item.message}
                    interactive={false}
                    isStreaming={false}
                    onSend={() => {}}
                  />
                )}
              </Box>
            )
          }
        </Static>

        <Box ref={dynamicRef} flexDirection="column" paddingX={1}>
          {messages.length === 0 ? <Welcome /> : null}
          {liveAssistant ? (
            <AssistantMessageView
              message={liveAssistant}
              interactive
              isStreaming={isRunning}
              onSend={send}
            />
          ) : null}
          {showThinking ? <Thinking /> : null}
          <Composer draft={draft} focused={composerFocused} isRunning={isRunning} />
        </Box>
      </Box>
    </MouseProvider>
  );
}
