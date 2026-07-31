import { describe, expect, it } from "vitest";
import { shouldAutoOpen } from "../useArtifactAutoOpen";

describe("shouldAutoOpen", () => {
  it.each([
    ["open-on-mount", true, true],
    ["open-on-mount", false, true],
    ["auto-open", true, true],
    ["auto-open", false, false],
    ["overview", true, false],
    ["overview", false, false],
  ] as const)("mode %s, streaming %s → %s", (mode, isStreaming, expected) => {
    expect(shouldAutoOpen(mode, isStreaming)).toBe(expected);
  });
});
