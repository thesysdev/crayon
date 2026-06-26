import type { Message } from "./message";

/**
 * Converts messages between AG-UI format (used internally) and the
 * format your backend / storage layer expects.
 *
 * Both methods operate on **arrays** so that formats where a single
 * AG-UI message maps to multiple backend items (e.g. OpenAI Responses
 * API) work seamlessly alongside 1-to-1 formats (e.g. Completions).
 *
 * @example
 * // Identity (default) — no conversion
 * const identity: MessageFormat = {
 *   toApi: (messages) => messages,
 *   fromApi: (data) => data as Message[],
 * };
 */
export interface MessageFormat {
  /** Convert AG-UI messages to the format your backend expects (outbound). */
  toApi(messages: Message[]): unknown;
  /** Convert messages from your backend/storage format to AG-UI (inbound). */
  fromApi(data: unknown): Message[];
}

/**
 * `reasoning` is a client-side display field colocated on the assistant turn,
 * not part of the wire message shape. Strip it so the identity format doesn't
 * echo accumulated thinking back to the backend on every subsequent turn.
 */
function stripReasoning(message: Message): Message {
  if (message.role !== "assistant" || message.reasoning === undefined) return message;
  const clone = { ...message };
  delete clone.reasoning;
  return clone;
}

/**
 * Default identity message format — no conversion (aside from dropping the
 * client-only `reasoning` field). Messages are sent and received as-is in
 * AG-UI format.
 */
export const identityMessageFormat: MessageFormat = {
  toApi: (messages) => messages.map(stripReasoning),
  fromApi: (data) => data as Message[],
};
