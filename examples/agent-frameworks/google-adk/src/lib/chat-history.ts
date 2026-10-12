import { storeChatCompletionHistory } from "@openuidev/server/openai";

export const THESYS_API_URL = "https://api.thesys.dev";

/**
 * The agent's output isn't stored anywhere the browser can read, so store each turn in
 * the thread's Cloud conversation as Chat Completions messages: the user's question,
 * then each text segment of the reply. useOpenuiCloudStorage() loads it when the thread
 * is reopened. Pass only the new turn.
 */
export async function storeTurn(threadId: string | undefined, question: string, answer: string[]) {
  const apiKey = process.env.THESYS_API_KEY;
  if (!threadId || !apiKey) return;
  try {
    await storeChatCompletionHistory({
      apiKey,
      apiBaseUrl: THESYS_API_URL,
      conversationId: threadId,
      messages: [
        { role: "user", content: question },
        ...answer.filter(Boolean).map((content) => ({ role: "assistant" as const, content })),
      ],
    });
  } catch (error) {
    console.error("Could not store the turn in the Cloud conversation.", error);
  }
}

/** Collects an AG-UI event stream's reply text, one entry per text message. */
export function agUiTextCollector() {
  const segments: string[] = [];
  return {
    segments,
    add(event: { type?: string; delta?: string }) {
      if (event.type === "TEXT_MESSAGE_START") segments.push("");
      else if (
        (event.type === "TEXT_MESSAGE_CONTENT" || event.type === "TEXT_MESSAGE_CHUNK") &&
        event.delta
      ) {
        if (segments.length === 0) segments.push("");
        segments[segments.length - 1] += event.delta;
      }
    },
  };
}
