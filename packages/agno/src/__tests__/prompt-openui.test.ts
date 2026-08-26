import { BuiltinActionType } from "@openuidev/react-lang";
import { describe, expect, it } from "vitest";
import {
  AGNO_OPENUI_PROMPT_TOOL_NAME,
  createAgnoOpenUIPromptRenderer,
  parseAgnoOpenUIPrompt,
} from "../prompt-openui";

describe("Agno OpenUI prompt renderer", () => {
  it("matches the conventional AgentOS tool name", () => {
    expect(createAgnoOpenUIPromptRenderer().toolName).toBe(AGNO_OPENUI_PROMPT_TOOL_NAME);
  });

  it("recovers a streamed ui argument", () => {
    expect(
      parseAgnoOpenUIPrompt({
        args: '{"ui":"root = Card([title])\\ntitle = TextContent(\\"Project',
        response: null,
      }),
    ).toMatchObject({ ui: 'root = Card([title])\ntitle = TextContent("Project' });
  });

  it("hydrates submitted form state from the AgentOS tool result", () => {
    expect(
      parseAgnoOpenUIPrompt({
        args: JSON.stringify({ ui: "root = Card([])" }),
        response: JSON.stringify({
          type: BuiltinActionType.ContinueConversation,
          message: "Submit project estimate",
          params: {},
          formName: "project_estimate",
          formState: { project_estimate: { project_name: { value: "Aurora" } } },
        }),
      }),
    ).toEqual({
      ui: "root = Card([])",
      result: {
        type: BuiltinActionType.ContinueConversation,
        message: "Submit project estimate",
        params: {},
        formName: "project_estimate",
        formState: { project_estimate: { project_name: { value: "Aurora" } } },
      },
    });
  });

  it("rejects calls without an OpenUI program", () => {
    expect(parseAgnoOpenUIPrompt({ args: "{}", response: null })).toBeNull();
  });
});
