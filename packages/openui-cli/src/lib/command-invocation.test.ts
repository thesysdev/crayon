import { describe, expect, it } from "vitest";

import { resolveCommandInvocation } from "./command-invocation";

describe("resolveCommandInvocation", () => {
  it("runs package-manager shims through cmd.exe on Windows", () => {
    expect(resolveCommandInvocation("pnpm", ["install"], "win32", "C:\\Windows\\cmd.exe")).toEqual({
      command: "C:\\Windows\\cmd.exe",
      args: ["/d", "/s", "/c", "pnpm", "install"],
    });
  });

  it("executes the command directly on POSIX platforms", () => {
    expect(resolveCommandInvocation("pnpm", ["install"], "darwin")).toEqual({
      command: "pnpm",
      args: ["install"],
    });
  });
});
