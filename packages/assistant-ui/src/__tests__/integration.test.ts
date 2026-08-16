import { createLibrary, defineComponent } from "@openuidev/react-lang";
import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { createOpenUIIntegration, openuiIntegration } from "../integration";

describe("assistant-ui OpenUI integration", () => {
  it("creates a matched default toolkit and instruction string", () => {
    expect(openuiIntegration.toolkit[openuiIntegration.toolNames.present]?.type).toBe("frontend");
    expect(openuiIntegration.toolkit[openuiIntegration.toolNames.prompt]?.type).toBe("human");
    expect(openuiIntegration.instructions).toContain(openuiIntegration.toolNames.present);
    expect(openuiIntegration.instructions).toContain(openuiIntegration.toolNames.prompt);
  });

  it("keeps custom tool names and component vocabulary aligned", () => {
    const Panel = defineComponent({
      name: "Panel",
      description: "A test panel.",
      props: z.object({ title: z.string() }),
      component: ({ props }) => props.title,
    });
    const library = createLibrary({ root: "Panel", components: [Panel] });
    const integration = createOpenUIIntegration({
      library,
      promptOptions: {},
      presentToolName: "show_panel",
      promptToolName: "ask_panel",
    });

    expect(integration.toolNames).toEqual({ present: "show_panel", prompt: "ask_panel" });
    expect(integration.toolkit.show_panel?.type).toBe("frontend");
    expect(integration.toolkit.ask_panel?.type).toBe("human");
    expect(integration.instructions).toContain("show_panel");
    expect(integration.instructions).toContain("ask_panel");
    expect(integration.instructions).toContain("Panel(title: string)");
  });
});
