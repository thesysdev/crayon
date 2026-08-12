import { createLibrary, defineComponent } from "@openuidev/react-lang";
import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { createOpenUIInstructions } from "../instructions";
import { createOpenUIToolkit, openuiToolkit, openuiToolParameters } from "../toolkit";

describe("assistant-ui OpenUI toolkit", () => {
  it("registers separate display and human tools", async () => {
    expect(openuiToolkit["present_openui"]?.type).toBe("frontend");
    expect(openuiToolkit["prompt_openui"]?.type).toBe("human");
    expect(openuiToolkit["present_openui"]?.display).toBe("standalone");
    expect(openuiToolkit["prompt_openui"]?.display).toBe("standalone");

    const execute = openuiToolkit["present_openui"]?.execute;
    expect(execute).toBeTypeOf("function");
    await expect(execute?.({}, {} as never)).resolves.toEqual({ displayed: true });
  });

  it("validates the streamed OpenUI argument", () => {
    expect(openuiToolParameters.parse({ ui: "root = Card([])" })).toEqual({
      ui: "root = Card([])",
    });
    expect(() => openuiToolParameters.parse({})).toThrow();
  });

  it("keeps custom tool names and component vocabulary aligned", () => {
    const Panel = defineComponent({
      name: "Panel",
      description: "A test panel.",
      props: z.object({ title: z.string() }),
      component: ({ props }) => props.title,
    });
    const library = createLibrary({ root: "Panel", components: [Panel] });
    const toolkit = createOpenUIToolkit({
      library,
      presentToolName: "show_panel",
      promptToolName: "ask_panel",
    });
    const instructions = createOpenUIInstructions({
      library,
      promptOptions: {},
      presentToolName: "show_panel",
      promptToolName: "ask_panel",
    });

    expect(toolkit["show_panel"]?.type).toBe("frontend");
    expect(toolkit["ask_panel"]?.type).toBe("human");
    expect(instructions).toContain("show_panel");
    expect(instructions).toContain("ask_panel");
    expect(instructions).toContain("Panel(title: string)");
  });

  it("rejects ambiguous tool names", () => {
    expect(() =>
      createOpenUIToolkit({
        presentToolName: "openui",
        promptToolName: "openui",
      }),
    ).toThrow("must use different names");
  });
});
