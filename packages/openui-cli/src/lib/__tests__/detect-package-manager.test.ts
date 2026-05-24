import { afterEach, describe, expect, it } from "vitest";
import { detectPackageManager } from "../detect-package-manager";

describe("detectPackageManager", () => {
  afterEach(() => {
    delete process.env["npm_config_user_agent"];
  });

  it('returns "pnpm dlx" when user agent starts with pnpm/', () => {
    process.env["npm_config_user_agent"] = "pnpm/9.0.0 node/v20.0.0 linux x64";
    expect(detectPackageManager()).toBe("pnpm dlx");
  });

  it('returns "yarn dlx" when user agent starts with yarn/', () => {
    process.env["npm_config_user_agent"] = "yarn/4.0.0 node/v20.0.0 linux x64";
    expect(detectPackageManager()).toBe("yarn dlx");
  });

  it('returns "bunx" when user agent starts with bun/', () => {
    process.env["npm_config_user_agent"] = "bun/1.0.0 linux x64";
    expect(detectPackageManager()).toBe("bunx");
  });

  it('returns "npx" when user agent starts with npm/', () => {
    process.env["npm_config_user_agent"] = "npm/10.0.0 node/v20.0.0 linux x64";
    expect(detectPackageManager()).toBe("npx");
  });

  it('returns "npx" when user agent is empty', () => {
    process.env["npm_config_user_agent"] = "";
    expect(detectPackageManager()).toBe("npx");
  });

  it('returns "npx" when user agent is undefined', () => {
    expect(detectPackageManager()).toBe("npx");
  });

  it('returns "npx" for unknown package managers', () => {
    process.env["npm_config_user_agent"] = "unknown/1.0.0";
    expect(detectPackageManager()).toBe("npx");
  });
});
