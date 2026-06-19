import { afterEach, describe, expect, it } from "vitest";

import { detectPackageManager } from "./detect-package-manager";

const originalUserAgent = process.env["npm_config_user_agent"];

afterEach(() => {
  if (originalUserAgent === undefined) {
    delete process.env["npm_config_user_agent"];
  } else {
    process.env["npm_config_user_agent"] = originalUserAgent;
  }
});

describe("detectPackageManager", () => {
  it.each([
    ["pnpm dlx", "pnpm/10.0.0 npm/? node/v22.0.0"],
    ["yarn dlx", "yarn/4.0.0 npm/? node/v22.0.0"],
    ["bunx", "bun/1.2.0 npm/? node/v22.0.0"],
    ["npx", "npm/11.0.0 node/v22.0.0"],
    ["npx", undefined],
  ])("returns %s for user agent %s", (expected, userAgent) => {
    if (userAgent === undefined) {
      delete process.env["npm_config_user_agent"];
    } else {
      process.env["npm_config_user_agent"] = userAgent;
    }

    expect(detectPackageManager()).toBe(expected);
  });
});
