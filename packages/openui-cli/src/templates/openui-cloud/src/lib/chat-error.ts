import { BILLING_CREDITS_ERROR_MESSAGE } from "./billing";

export async function getChatErrorMessage(response: Response): Promise<string> {
  if (response.status === 429) return BILLING_CREDITS_ERROR_MESSAGE;

  try {
    const data = (await response.clone().json()) as { error?: { message?: unknown } };
    if (typeof data.error?.message === "string" && data.error.message.trim()) {
      return data.error.message;
    }
  } catch {
    // Fall through to a concise status-based message.
  }

  return `Request failed: ${response.status} ${response.statusText}`;
}
