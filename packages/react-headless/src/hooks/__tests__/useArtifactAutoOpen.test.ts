import { describe, expect, it } from "vitest";
import { shouldAutoOpen } from "../useArtifactAutoOpen";

// The auto-open decision matrix. The hook is a once-latch around this pure
// predicate (plus the store-level _markAutoOpened latch, tested in
// store/__tests__/detailedViewAutoOpenLatch.test.ts), so the matrix is the
// behavior:
//   open-on-mount → open on mount, streaming or not (deep-link / kiosk).
//   auto-open     → open only while the artifact streams live.
//   overview      → never (the click-to-open default).
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
