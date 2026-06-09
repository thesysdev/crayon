import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { detectPackageManager } from "../detect-package-manager";

describe("detectPackageManager", () => {
  const originalUserAgent = process.env["npm_config_user_agent"];

  beforeEach(() => {
    delete process.env["npm_config_user_agent"];
  });

  afterEach(() => {
    if (originalUserAgent === undefined) {
      delete process.env["npm_config_user_agent"];
    } else {
      process.env["npm_config_user_agent"] = originalUserAgent;
    }
  });

  it("returns 'pnpm dlx' for a pnpm user agent", () => {
    process.env["npm_config_user_agent"] = "pnpm/9.1.0 npm/? node/v20.0.0 linux x64";
    expect(detectPackageManager()).toBe("pnpm dlx");
  });

  it("returns 'yarn dlx' for a yarn user agent", () => {
    process.env["npm_config_user_agent"] = "yarn/4.1.0 npm/? node/v20.0.0 linux x64";
    expect(detectPackageManager()).toBe("yarn dlx");
  });

  it("returns 'bunx' for a bun user agent", () => {
    process.env["npm_config_user_agent"] = "bun/1.1.0 npm/? node/v20.0.0 linux x64";
    expect(detectPackageManager()).toBe("bunx");
  });

  it("returns 'npx' for an npm user agent", () => {
    process.env["npm_config_user_agent"] = "npm/10.5.0 node/v20.0.0 linux x64";
    expect(detectPackageManager()).toBe("npx");
  });

  it("returns 'npx' when the user agent is unset", () => {
    expect(detectPackageManager()).toBe("npx");
  });

  it("returns 'npx' for an unrecognized user agent", () => {
    process.env["npm_config_user_agent"] = "deno/1.40.0";
    expect(detectPackageManager()).toBe("npx");
  });

  it("does not match package managers that merely contain the name", () => {
    // The check is prefix-based, so a stray substring must not trigger a match.
    process.env["npm_config_user_agent"] = "custom-pnpm/1.0.0";
    expect(detectPackageManager()).toBe("npx");
  });
});
