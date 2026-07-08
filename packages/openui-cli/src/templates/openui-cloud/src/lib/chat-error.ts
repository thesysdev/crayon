import {
  getBillingCreditsErrorMessage,
  shouldShowBillingCreditsNotice,
} from "./billing";

interface ChatErrorMessageOptions {
  showBillingCreditsNotice?: boolean;
}

export async function getChatErrorMessage(
  response: Response,
  { showBillingCreditsNotice = shouldShowBillingCreditsNotice() }: ChatErrorMessageOptions = {},
): Promise<string> {
  if (response.status === 429) {
    return getBillingCreditsErrorMessage(showBillingCreditsNotice);
  }

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
