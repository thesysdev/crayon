import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ArgDef } from "../resolve-args";

vi.mock("@inquirer/prompts", () => ({
  input: vi.fn(),
  select: vi.fn(),
}));

vi.mock("@inquirer/core", () => ({
  ExitPromptError: class ExitPromptError extends Error {
    constructor() {
      super("Prompt was cancelled");
      this.name = "ExitPromptError";
    }
  },
}));

describe("resolveArgs", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  describe("with provided values", () => {
    it("returns provided values without prompting", async () => {
      const { resolveArgs } = await import("../resolve-args");
      const defs: Record<string, ArgDef<unknown>> = {
        name: { value: "test-app" },
        template: { value: "nextjs" },
      };

      const result = await resolveArgs(defs, true);
      expect(result).toEqual({ name: "test-app", template: "nextjs" });
    });

    it("works in non-interactive mode when all values provided", async () => {
      const { resolveArgs } = await import("../resolve-args");
      const defs: Record<string, ArgDef<unknown>> = {
        name: { value: "my-app" },
      };

      const result = await resolveArgs(defs, false);
      expect(result).toEqual({ name: "my-app" });
    });
  });

  describe("non-interactive missing required args", () => {
    it("logs error and exits when required arg is missing", async () => {
      const exitMock = vi.spyOn(process, "exit").mockImplementation((() => {
        throw new Error("process.exit called");
      }) as any);

      const stderrMock = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

      const { resolveArgs } = await import("../resolve-args");
      const defs: Record<string, ArgDef<unknown>> = {
        name: { prompt: { type: "input", message: "App name?" }, required: true },
      };

      await expect(resolveArgs(defs, false)).rejects.toThrow("process.exit called");
      expect(exitMock).toHaveBeenCalledWith(1);

      exitMock.mockRestore();
      stderrMock.mockRestore();
    });
  });

  describe("interactive mode", () => {
    it("prompts for missing required input args", async () => {
      const { resolveArgs } = await import("../resolve-args");
      const { input } = await import("@inquirer/prompts");
      vi.mocked(input).mockResolvedValue("my-app");

      const defs: Record<string, ArgDef<unknown>> = {
        name: { prompt: { type: "input", message: "App name?" }, required: true },
      };

      const result = await resolveArgs(defs, true);
      expect(result).toEqual({ name: "my-app" });
      expect(input).toHaveBeenCalledWith({ message: "App name?", default: undefined });
    });

    it("prompts with default value for input args", async () => {
      const { resolveArgs } = await import("../resolve-args");
      const { input } = await import("@inquirer/prompts");
      vi.mocked(input).mockResolvedValue("my-app");

      const defs: Record<string, ArgDef<unknown>> = {
        name: {
          prompt: { type: "input", message: "App name?", default: "my-app" },
          required: true,
        },
      };

      const result = await resolveArgs(defs, true);
      expect(result).toEqual({ name: "my-app" });
      expect(input).toHaveBeenCalledWith({ message: "App name?", default: "my-app" });
    });

    it("prompts for missing required select args", async () => {
      const { resolveArgs } = await import("../resolve-args");
      const { select } = await import("@inquirer/prompts");
      vi.mocked(select).mockResolvedValue("nextjs");

      const defs: Record<string, ArgDef<unknown>> = {
        template: {
          prompt: {
            type: "select",
            message: "Pick a template",
            choices: [
              { value: "nextjs", name: "Next.js" },
              { value: "vite", name: "Vite" },
            ],
          },
          required: true,
        },
      };

      const result = await resolveArgs(defs, true);
      expect(result).toEqual({ template: "nextjs" });
      expect(select).toHaveBeenCalledWith({
        message: "Pick a template",
        choices: [
          { value: "nextjs", name: "Next.js" },
          { value: "vite", name: "Vite" },
        ],
      });
    });

    it("mixes provided values and prompted args", async () => {
      const { resolveArgs } = await import("../resolve-args");
      const { input } = await import("@inquirer/prompts");
      vi.mocked(input).mockResolvedValue("my-app");

      const defs: Record<string, ArgDef<unknown>> = {
        name: { value: "fixed-name" },
        template: {
          prompt: { type: "input", message: "Template?" },
          required: true,
        },
      };

      const result = await resolveArgs(defs, true);
      expect(result).toEqual({ name: "fixed-name", template: "my-app" });
      expect(input).toHaveBeenCalledTimes(1);
    });

    it("handles ExitPromptError gracefully", async () => {
      const exitMock = vi.spyOn(process, "exit").mockImplementation((() => {
        throw new Error("process.exit called");
      }) as any);

      const { resolveArgs } = await import("../resolve-args");
      const { input } = await import("@inquirer/prompts");
      const { ExitPromptError } = await import("@inquirer/core");
      vi.mocked(input).mockRejectedValue(new ExitPromptError());

      const defs: Record<string, ArgDef<unknown>> = {
        name: { prompt: { type: "input", message: "App name?" }, required: true },
      };

      await expect(resolveArgs(defs, true)).rejects.toThrow("process.exit called");
      expect(exitMock).toHaveBeenCalledWith(0);

      exitMock.mockRestore();
    });
  });
});
