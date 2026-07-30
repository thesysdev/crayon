import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_MODEL } from "../../../lib/openui-cloud/models";

const { captureDemoAgentInteraction } = vi.hoisted(() => ({
  captureDemoAgentInteraction: vi.fn(),
}));

vi.mock("../../../lib/demo-analytics", () => ({
  captureDemoAgentInteraction,
}));

import {
  captureComparisonPromptInteractions,
  captureComparisonRenderedAction,
} from "./comparison-analytics";

beforeEach(() => {
  captureDemoAgentInteraction.mockReset();
});

describe("comparison analytics", () => {
  it("captures one model-attributed event for each visible comparison mode", () => {
    captureComparisonPromptInteractions(["markdown", "cloud"], "composer");

    expect(captureDemoAgentInteraction).toHaveBeenCalledTimes(2);
    expect(captureDemoAgentInteraction).toHaveBeenNthCalledWith(1, {
      demo: "compare",
      variant: "markdown",
      model: DEFAULT_MODEL,
      interaction_source: "composer",
    });
    expect(captureDemoAgentInteraction).toHaveBeenNthCalledWith(2, {
      demo: "compare",
      variant: "cloud",
      model: DEFAULT_MODEL,
      interaction_source: "composer",
    });
  });

  it("captures only modes that actually remain available", () => {
    captureComparisonPromptInteractions(["oss"], "starter");

    expect(captureDemoAgentInteraction).toHaveBeenCalledOnce();
    expect(captureDemoAgentInteraction).toHaveBeenCalledWith({
      demo: "compare",
      variant: "oss",
      model: DEFAULT_MODEL,
      interaction_source: "starter",
    });
  });

  it("captures a rendered action only for its target panel", () => {
    captureComparisonRenderedAction("cloud");

    expect(captureDemoAgentInteraction).toHaveBeenCalledOnce();
    expect(captureDemoAgentInteraction).toHaveBeenCalledWith({
      demo: "compare",
      variant: "cloud",
      model: DEFAULT_MODEL,
      interaction_source: "rendered_action",
    });
  });
});
