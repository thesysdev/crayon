import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveArgs } from "./resolve-args";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("resolveArgs", () => {
  it("returns provided values without prompting", async () => {
    await expect(
      resolveArgs(
        {
          name: { value: "demo-app" },
          template: { value: "nextjs" },
        },
        false,
      ),
    ).resolves.toEqual({
      name: "demo-app",
      template: "nextjs",
    });
  });

  it("exits predictably for missing required args in non-interactive mode", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit:${code}`);
    });

    await expect(
      resolveArgs(
        {
          name: {
            prompt: { type: "input", message: "Project name" },
            required: true,
          },
        },
        false,
      ),
    ).rejects.toThrow("process.exit:1");

    expect(errorSpy).toHaveBeenCalledWith("Error: Missing required argument --name");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
