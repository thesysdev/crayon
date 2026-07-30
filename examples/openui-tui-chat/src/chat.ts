import {
  openAIReadableStreamAdapter,
  processStreamedMessage,
  type AssistantMessage,
  type Message,
} from "@openuidev/react-headless";
import { useCallback, useRef, useState } from "react";

export type ProcessFn = (params: {
  threadId: string;
  messages: Message[];
  abortController: AbortController;
}) => Promise<Response>;

export interface LocalChat {
  messages: Message[];
  isRunning: boolean;
  send: (content: string) => void;
}

/**
 * Minimal chat store that runs on the SAME React instance Ink uses. It reuses
 * react-headless's DOM-free streaming pipeline (`processStreamedMessage` +
 * `openAIReadableStreamAdapter`) without its React `ChatProvider`, which would
 * otherwise pull in a second React copy and break Ink's reconciler.
 */
export function useLocalChat(processMessage: ProcessFn): LocalChat {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;
  const runningRef = useRef(false);

  const send = useCallback(
    async (content: string) => {
      if (!content.trim() || runningRef.current) return;
      runningRef.current = true;

      const userMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
      } as unknown as Message;

      const next = [...messagesRef.current, userMessage];
      setMessages(next);
      setIsRunning(true);

      const abortController = new AbortController();
      try {
        const response = await processMessage({ threadId: "tui", messages: next, abortController });
        await processStreamedMessage({
          response,
          adapter: openAIReadableStreamAdapter(),
          createMessage: (m: AssistantMessage) => setMessages((cur) => [...cur, m]),
          updateMessage: (m: AssistantMessage) =>
            setMessages((cur) => cur.map((x) => (x.id === m.id ? { ...m } : x))),
          deleteMessage: (id: string) => setMessages((cur) => cur.filter((x) => x.id !== id)),
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        const errorMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `root = Card([e])\ne = TextContent("Error: ${message.replace(/"/g, "'")}")`,
        } as unknown as Message;
        setMessages((cur) => [...cur, errorMessage]);
      } finally {
        runningRef.current = false;
        setIsRunning(false);
      }
    },
    [processMessage],
  );

  return { messages, isRunning, send };
}
