import { afterEach, describe, expect, it, vi } from "vitest";
import { GITHUB_DEMO_MODEL } from "./demo-models";
import { DEFAULT_MODEL } from "./openui-cloud/models";

const { capture } = vi.hoisted(() => ({
  capture: vi.fn(),
}));

vi.mock("./analytics", () => ({
  analytics: { capture },
}));

import {
  captureDemoAgentInteraction,
  DEMO_AGENT_INTERACTION_EVENT,
  getDemoAgentInteractionProperties,
  getDemoInteractionSourceFromMessages,
  type DemoAgentInteraction,
} from "./demo-analytics";

afterEach(() => {
  capture.mockReset();
  vi.unstubAllGlobals();
});

describe("getDemoInteractionSourceFromMessages", () => {
  const starter = "Build a revenue dashboard";

  it("classifies a matching first user turn as a starter", () => {
    expect(
      getDemoInteractionSourceFromMessages([{ role: "user", content: starter }], [starter]),
    ).toBe("starter");
  });

  it("classifies the same text later in a thread as composer input", () => {
    expect(
      getDemoInteractionSourceFromMessages(
        [
          { role: "user", content: "First turn" },
          { role: "assistant", content: "Response" },
          { role: "user", content: starter },
        ],
        [starter],
      ),
    ).toBe("composer");
  });

  it("classifies the strict OpenUI action context as a rendered action", () => {
    expect(
      getDemoInteractionSourceFromMessages([
        {
          role: "user",
          content:
            ']]>openui:content\nContinue\n]]>openui:context\n["User clicked: Continue",{"choice":"a"}]',
        },
      ]),
    ).toBe("rendered_action");
  });

  it("does not mistake arbitrary context or malformed content for an action", () => {
    expect(
      getDemoInteractionSourceFromMessages([
        {
          role: "user",
          content: 'Prompt\n]]>openui:context\n["Not an action"]',
        },
      ]),
    ).toBe("composer");
    expect(getDemoInteractionSourceFromMessages([])).toBeNull();
  });
});

describe("getDemoAgentInteractionProperties", () => {
  it("builds the complete bounded event payload", () => {
    expect(
      getDemoAgentInteractionProperties({
        demo: "compare",
        variant: "markdown",
        model: DEFAULT_MODEL,
        interaction_source: "starter",
      }),
    ).toEqual({
      demo: "compare",
      variant: "markdown",
      model: DEFAULT_MODEL,
      interaction_source: "starter",
    });
  });

  it("omits absent and unrecognized variants", () => {
    expect(
      getDemoAgentInteractionProperties({
        demo: "github_dashboard",
        model: GITHUB_DEMO_MODEL,
        interaction_source: "starter",
      }),
    ).toEqual({
      demo: "github_dashboard",
      model: GITHUB_DEMO_MODEL,
      interaction_source: "starter",
    });

    expect(
      getDemoAgentInteractionProperties({
        demo: "openui_vs_json",
        variant: "a prompt must never become a dimension",
        model: "openai/gpt-5.2",
        interaction_source: "composer",
      }),
    ).toEqual({
      demo: "openui_vs_json",
      model: "openai/gpt-5.2",
      interaction_source: "composer",
    });
  });

  it("allows canonical model identifiers", () => {
    expect(
      getDemoAgentInteractionProperties({
        demo: "openui_chat",
        variant: "cloud",
        model: "anthropic/claude-sonnet-5",
        interaction_source: "composer",
      }),
    ).toEqual({
      demo: "openui_chat",
      variant: "cloud",
      model: "anthropic/claude-sonnet-5",
      interaction_source: "composer",
    });
  });

  it("drops variants that belong to a different demo", () => {
    expect(
      getDemoAgentInteractionProperties({
        demo: "compare",
        variant: "markdown_vs_cloud",
        model: DEFAULT_MODEL,
        interaction_source: "composer",
      }),
    ).toEqual({
      demo: "compare",
      model: DEFAULT_MODEL,
      interaction_source: "composer",
    });

    expect(
      getDemoAgentInteractionProperties({
        demo: "github_dashboard",
        variant: "oss",
        model: GITHUB_DEMO_MODEL,
        interaction_source: "composer",
      }),
    ).toEqual({
      demo: "github_dashboard",
      model: GITHUB_DEMO_MODEL,
      interaction_source: "composer",
    });
  });

  it("does not forward extra or content-bearing fields", () => {
    const interaction = {
      demo: "openui_chat",
      variant: "cloud",
      model: DEFAULT_MODEL,
      interaction_source: "rendered_action",
      prompt: "private prompt",
      messages: ["private response"],
      thread_id: "private-thread",
    } as DemoAgentInteraction & Record<string, unknown>;

    expect(getDemoAgentInteractionProperties(interaction)).toEqual({
      demo: "openui_chat",
      variant: "cloud",
      model: DEFAULT_MODEL,
      interaction_source: "rendered_action",
    });
  });

  it("rejects malformed core dimensions at runtime", () => {
    expect(getDemoAgentInteractionProperties(null as unknown as DemoAgentInteraction)).toBeNull();

    expect(
      getDemoAgentInteractionProperties({
        demo: "unknown",
        interaction_source: "composer",
      } as unknown as DemoAgentInteraction),
    ).toBeNull();

    expect(
      getDemoAgentInteractionProperties({
        demo: "compare",
        model: DEFAULT_MODEL,
        interaction_source: "click",
      } as unknown as DemoAgentInteraction),
    ).toBeNull();

    expect(
      getDemoAgentInteractionProperties({
        demo: "github_dashboard",
        model: DEFAULT_MODEL,
        interaction_source: "composer",
      }),
    ).toBeNull();
  });
});

describe("captureDemoAgentInteraction", () => {
  it("does not capture during server rendering", () => {
    captureDemoAgentInteraction({
      demo: "github_dashboard",
      model: GITHUB_DEMO_MODEL,
      interaction_source: "composer",
    });

    expect(capture).not.toHaveBeenCalled();
  });

  it("captures exactly one allowlisted event in the browser", () => {
    vi.stubGlobal("window", {});

    captureDemoAgentInteraction({
      demo: "openui_chat",
      variant: "oss",
      model: DEFAULT_MODEL,
      interaction_source: "starter",
    });

    expect(capture).toHaveBeenCalledOnce();
    expect(capture).toHaveBeenCalledWith(DEMO_AGENT_INTERACTION_EVENT, {
      demo: "openui_chat",
      variant: "oss",
      model: DEFAULT_MODEL,
      interaction_source: "starter",
    });
  });

  it("does not capture malformed core dimensions", () => {
    vi.stubGlobal("window", {});

    captureDemoAgentInteraction({
      demo: "other",
      interaction_source: "composer",
    } as unknown as DemoAgentInteraction);

    expect(capture).not.toHaveBeenCalled();
  });

  it("does not throw when the analytics client fails synchronously", () => {
    vi.stubGlobal("window", {});
    capture.mockImplementationOnce(() => {
      throw new Error("capture failed");
    });

    expect(() =>
      captureDemoAgentInteraction({
        demo: "compare",
        variant: "oss",
        model: DEFAULT_MODEL,
        interaction_source: "rendered_action",
      }),
    ).not.toThrow();
  });
});
