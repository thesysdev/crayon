import { storeChatCompletionHistory } from "@openuidev/server/openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { requiredEnv, THESYS_API_URL } from "./env";

/**
 * Chat Completions doesn't save conversations, so store each turn in the thread's
 * Cloud conversation. useOpenuiCloudStorage() loads it when the thread is reopened.
 * Pass only the new turn: the user's message, then the assistant's reply.
 */
export async function storeTurn(
  threadId: string | undefined,
  messages: ChatCompletionMessageParam[],
) {
  if (!threadId) return;
  try {
    await storeChatCompletionHistory({
      apiKey: requiredEnv("THESYS_API_KEY"),
      apiBaseUrl: THESYS_API_URL,
      conversationId: threadId,
      messages,
    });
  } catch (error) {
    console.error("Could not store the turn in the Cloud conversation.", error);
  }
}
