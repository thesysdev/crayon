export const BILLING_CREDITS_ERROR_MESSAGE =
  "Looks like this workspace is out of OpenUI Cloud credits. Purchase credits to keep testing, then try your request again. This notice is only shown in development.";

export const GENERIC_CHAT_ERROR_MESSAGE =
  "Something went wrong while sending your message. Please try again.";

export function shouldShowBillingCreditsNotice(nodeEnv = process.env.NODE_ENV): boolean {
  return nodeEnv === "development";
}

export function getBillingCreditsErrorMessage(
  showBillingCreditsNotice = shouldShowBillingCreditsNotice(),
): string {
  return showBillingCreditsNotice ? BILLING_CREDITS_ERROR_MESSAGE : GENERIC_CHAT_ERROR_MESSAGE;
}
