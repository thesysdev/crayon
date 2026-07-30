import { describe, expect, it } from "vitest";
import {
  addThesysLinkAttribution,
  POSTHOG_DISTINCT_ID_PARAM,
  POSTHOG_SESSION_ID_PARAM,
} from "./thesys-link-attribution";

describe("addThesysLinkAttribution", () => {
  it("forwards anonymous PostHog identity to a Thesys console link", () => {
    const attributed = new URL(
      addThesysLinkAttribution(
        "https://console.thesys.dev/keys?ref=docs#api",
        "https://openui.com/demo/github",
        "019b0630-3100-7d69-8ee9-99b639e6474a",
        "019b0631-3100-7d69-8ee9-99b639e6474b",
      ),
    );

    expect(attributed.pathname).toBe("/keys");
    expect(attributed.searchParams.get("ref")).toBe("docs");
    expect(attributed.searchParams.get("utm_source")).toBe("openui");
    expect(attributed.searchParams.get("utm_medium")).toBe("referral");
    expect(attributed.searchParams.get("utm_campaign")).toBe("openui_to_thesys");
    expect(attributed.searchParams.get(POSTHOG_DISTINCT_ID_PARAM)).toBe(
      "019b0630-3100-7d69-8ee9-99b639e6474a",
    );
    expect(attributed.searchParams.get(POSTHOG_SESSION_ID_PARAM)).toBe(
      "019b0631-3100-7d69-8ee9-99b639e6474b",
    );
    expect(attributed.hash).toBe("#api");
  });

  it("does not decorate links outside thesys.dev", () => {
    expect(
      addThesysLinkAttribution(
        "https://example.com/?posthog_distinct_id=keep",
        "https://openui.com",
        "anonymous-id",
        "session-id",
      ),
    ).toBe("https://example.com/?posthog_distinct_id=keep");
  });

  it("adds campaign attribution without inventing missing PostHog IDs", () => {
    const attributed = new URL(
      addThesysLinkAttribution("https://thesys.dev", "https://openui.com", undefined, undefined),
    );

    expect(attributed.searchParams.get("utm_source")).toBe("openui");
    expect(attributed.searchParams.has(POSTHOG_DISTINCT_ID_PARAM)).toBe(false);
    expect(attributed.searchParams.has(POSTHOG_SESSION_ID_PARAM)).toBe(false);
  });
});
