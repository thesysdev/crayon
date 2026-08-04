export async function getResponseErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.clone().json()) as {
      error?: { message?: unknown } | string;
      message?: unknown;
    };
    const message =
      typeof data.error === "string"
        ? data.error
        : typeof data.error?.message === "string"
          ? data.error.message
          : typeof data.message === "string"
            ? data.message
            : null;

    if (message?.trim()) return message;
  } catch {
    // Fall through to the status-based message.
  }

  return `Request failed: ${response.status} ${response.statusText}`.trim();
}
