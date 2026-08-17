import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SDK_VERSION } from "./wire";

describe("SDK_VERSION", () => {
  it("matches packages/observability-cloud/package.json version", () => {
    const packageJsonPath = join(dirname(fileURLToPath(import.meta.url)), "../../package.json");
    const { version } = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { version: string };
    expect(SDK_VERSION).toBe(version);
  });
});
