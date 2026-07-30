import { useThread } from "@openuidev/react-headless";
import { Box, Text, useFocus, useInput } from "ink";
import { useState } from "react";
import { RenderValue } from "./genui/components.js";
import { TuiProvider } from "./genui/context.js";
import { tuiLibrary } from "./genui/library.js";
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

export function App() {
  const messages = useThread((s) => s.messages);
  const isRunning = useThread((s) => s.isRunning);
  const processMessage = useThread((s) => s.processMessage);
  const [draft, setDraft] = useState("");

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const response = lastAssistant ? messageText(lastAssistant.content) : null;

  const onSend = (content: string) => {
    if (!isRunning) processMessage({ role: "user", content });
  };

  const { result, ctx } = useGenUi(
    tuiLibrary,
    lastAssistant?.id ?? null,
    response,
    isRunning,
    onSend,
  );

  const { isFocused: composerFocused } = useFocus({ id: "composer", autoFocus: true });
  useInput(
    (input, key) => {
      if (key.return) {
        const text = draft.trim();
        if (text && !isRunning) {
          onSend(text);
          setDraft("");
        }
        return;
      }
      if (key.backspace || key.delete) {
        setDraft((d) => d.slice(0, -1));
        return;
      }
      if (input && !key.ctrl && !key.meta && !key.tab) setDraft((d) => d + input);
    },
    { isActive: composerFocused },
  );

  const userMessages = messages.filter((m) => m.role === "user");

  return (
    <TuiProvider value={ctx}>
      <Box flexDirection="column" paddingX={1}>
        <Text color="green" bold>
          OpenUI TUI Chat{"  "}
          <Text dimColor>· streamed OpenUI Lang, rendered in your terminal</Text>
        </Text>

        {userMessages.map((m) => (
          <Text key={m.id} color="gray">
            {"› "}
            {messageText(m.content).split("\n")[0]}
          </Text>
        ))}

        {result?.root ? (
          <Box marginTop={1}>
            <RenderValue value={result.root} />
          </Box>
        ) : messages.length === 0 ? (
          <Box marginTop={1} flexDirection="column">
            <Text dimColor>Ask for a chart, a table, or a form. Try:</Text>
            <Text dimColor> · "Compare the 4 largest countries by population as a bar chart"</Text>
            <Text dimColor> · "Build a contact form with name, email and a topic dropdown"</Text>
          </Box>
        ) : null}

        {isRunning ? (
          <Text color="cyan">{"\n"}◐ thinking…</Text>
        ) : null}

        <Box marginTop={1}>
          <Text color={composerFocused ? "green" : "gray"}>{composerFocused ? "❯ " : "  "}</Text>
          <Text>{draft || (composerFocused ? "" : "")}</Text>
          <Text color="green">{composerFocused ? "▏" : ""}</Text>
          {draft.length === 0 && composerFocused ? (
            <Text dimColor>type a message · Enter to send · Tab to focus UI · Ctrl+C to quit</Text>
          ) : null}
        </Box>
      </Box>
    </TuiProvider>
  );
}
