// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createOpenUIIntegration } from "../integration";
import { OpenUIProvider } from "../provider";

const { useAgentContext, useFrontendTool, useHumanInTheLoop } = vi.hoisted(() => ({
  useAgentContext: vi.fn(),
  useFrontendTool: vi.fn(),
  useHumanInTheLoop: vi.fn(),
}));

vi.mock("@copilotkit/react-core/v2", () => ({
  useAgentContext,
  useFrontendTool,
  useHumanInTheLoop,
}));

describe("OpenUIProvider", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it("registers the frontend tool, interactive human tool, and matching context", async () => {
    const integration = createOpenUIIntegration({
      presentToolName: "show_openui",
      promptToolName: "ask_openui",
    });

    await act(async () => root.render(<OpenUIProvider integration={integration} />));

    expect(useFrontendTool).toHaveBeenCalledOnce();
    expect(useFrontendTool.mock.calls[0]?.[0]).toBe(integration.frontendTools[0]);
    expect(useHumanInTheLoop).toHaveBeenCalledOnce();
    expect(useHumanInTheLoop.mock.calls[0]?.[0]).toBe(integration.humanInTheLoop[0]);
    expect(useAgentContext).toHaveBeenCalledWith({
      description: "Instructions for rendering requested interfaces with OpenUI tools",
      value: integration.instructions,
    });
  });
});
