import {
  getBillingCreditsErrorMessage,
  shouldShowBillingCreditsNotice,
} from "./billing";

interface ChatErrorMessageOptions {
  showBillingCreditsNotice?: boolean;
}

export const FREE_MODEL_LIMIT_ERROR_MESSAGE =
  "This free model has hit its shared usage limit for now. Switch to a standard model in the model picker or try again later — your credits are unaffected.";

/**
 * Free-model throttling also answers 429, but it is NOT a billing problem —
 * telling users with credits to buy credits sends them in the wrong
 * direction. Detect it from the error body so it gets its own message.
 */
export async function isFreeModelLimitResponse(response: Response): Promise<boolean> {
  if (response.status !== 429) return false;
  try {
    // The API reports the error kind in `type` (e.g. ERR_QUOTA_EXCEEDED,
    // ERR_FREE_MODEL_LIMIT); `code` is read too since OpenAI-shaped errors
    // use that name.
    const data = (await response.clone().json()) as {
      error?: { type?: unknown; code?: unknown; message?: unknown };
    };
    const kind = [data.error?.type, data.error?.code].find((v) => typeof v === "string") ?? "";
    const message = typeof data.error?.message === "string" ? data.error.message : "";
    return kind === "ERR_FREE_MODEL_LIMIT" || /free[- ]model/i.test(message);
  } catch {
    return false;
  }
}

export async function getChatErrorMessage(
  response: Response,
  { showBillingCreditsNotice = shouldShowBillingCreditsNotice() }: ChatErrorMessageOptions = {},
): Promise<string> {
  if (response.status === 429) {
    if (await isFreeModelLimitResponse(response)) {
      return FREE_MODEL_LIMIT_ERROR_MESSAGE;
    }
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
