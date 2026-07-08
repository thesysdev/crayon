import { describe, expect, it } from "vitest";

import { BILLING_CREDITS_ACTION_LABEL, BILLING_CREDITS_ERROR_MESSAGE, BILLING_URL } from "./billing";
import { getChatErrorMessage } from "./chat-error";

describe("getChatErrorMessage", () => {
  it("shows a billing call-to-action for 429 responses", async () => {
    const message = await getChatErrorMessage(new Response(null, { status: 429 }));

    expect(message).toBe(BILLING_CREDITS_ERROR_MESSAGE);
    expect(message).toContain(BILLING_CREDITS_ACTION_LABEL);
    expect(message).not.toContain(BILLING_URL);
  });

  it("uses API error messages for other JSON failures", async () => {
    const response = Response.json(
      { error: { message: "The selected model is unavailable." } },
      { status: 400 },
    );

    await expect(getChatErrorMessage(response)).resolves.toBe(
      "The selected model is unavailable.",
    );
  });

  it("falls back to status text when no structured message is available", async () => {
    const response = new Response("not json", {
      status: 502,
      statusText: "Bad Gateway",
    });

    await expect(getChatErrorMessage(response)).resolves.toBe(
      "Request failed: 502 Bad Gateway",
    );
  });
});
