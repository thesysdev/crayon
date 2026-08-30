// @vitest-environment jsdom

import { createLibrary, defineComponent } from "@openuidev/react-lang";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";
import {
  createOpenUIIntegration,
  createOpenUIToolParameters,
  openuiIntegration,
} from "../integration";

vi.mock("@copilotkit/react-core/v2", () => ({}));

describe("CopilotKit OpenUI integration", () => {
  it("creates matched default tools and instructions", () => {
    const [present] = openuiIntegration.frontendTools;
    const [prompt] = openuiIntegration.humanInTheLoop;

    expect(present.name).toBe(openuiIntegration.toolNames.present);
    expect(present.followUp).toBe(false);
    expect(prompt.name).toBe(openuiIntegration.toolNames.prompt);
    expect(prompt.followUp).toBe(true);
    expect(openuiIntegration.instructions).toContain(openuiIntegration.toolNames.present);
    expect(openuiIntegration.instructions).toContain(openuiIntegration.toolNames.prompt);
  });

  it("validates the streamed OpenUI program argument", async () => {
    const parameters = createOpenUIToolParameters();

    await expect(parameters.parseAsync({ ui: "root = Card([])" })).resolves.toEqual({
      ui: "root = Card([])",
    });
    await expect(parameters.parseAsync({})).rejects.toThrow();
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
      agentId: "support-agent",
      available: false,
    });

    expect(integration.toolNames).toEqual({ present: "show_panel", prompt: "ask_panel" });
    expect(integration.frontendTools[0]).toMatchObject({
      name: "show_panel",
      agentId: "support-agent",
      available: false,
    });
    expect(integration.humanInTheLoop[0]).toMatchObject({
      name: "ask_panel",
      agentId: "support-agent",
      available: false,
    });
    expect(integration.instructions).toContain("show_panel");
    expect(integration.instructions).toContain("ask_panel");
    expect(integration.instructions).toContain("Panel(title: string)");
  });

  it("rejects ambiguous tool names", () => {
    expect(() =>
      createOpenUIIntegration({ presentToolName: "openui", promptToolName: "openui" }),
    ).toThrow("different names");
  });
});
