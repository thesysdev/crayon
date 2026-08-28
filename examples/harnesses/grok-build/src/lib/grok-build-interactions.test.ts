import { afterEach, describe, expect, it } from "vitest";
import { GrokBuildInteractionBroker, parseGrokBuildInteraction } from "./grok-build-interactions";

const sessionId = "0198f9e5-f4fb-7b64-91f0-0cab13d00d01";

function questionParams(mode: "default" | "plan" = "default") {
  return {
    sessionId,
    toolCallId: "tool-question-1",
    mode,
    questions: [
      {
        question: "Which database?",
        multiSelect: false,
        options: [
          {
            label: "Postgres (Recommended)",
            description: "Relational and durable",
            preview: "CREATE TABLE users (...);",
          },
          { label: "Redis", description: "Fast in-memory storage" },
        ],
      },
    ],
  };
}

describe("GrokBuildInteractionBroker", () => {
  let broker = new GrokBuildInteractionBroker(60_000);

  afterEach(() => {
    broker.cancelAll();
    broker = new GrokBuildInteractionBroker(60_000);
  });

  it("parses wrapped ask-user requests and preserves question metadata", () => {
    const parsed = parseGrokBuildInteraction("_x.ai/ask_user_question", {
      method: "x.ai/ask_user_question",
      params: questionParams("plan"),
    });

    expect(parsed).toMatchObject({
      kind: "question",
      sessionId,
      toolCallId: "tool-question-1",
      mode: "plan",
      questions: [
        {
          question: "Which database?",
          multiSelect: false,
          options: [
            {
              label: "Postgres (Recommended)",
              description: "Relational and durable",
              preview: "CREATE TABLE users (...);",
            },
            {
              label: "Redis",
              description: "Fast in-memory storage",
            },
          ],
        },
      ],
    });
  });

  it("waits for and sanitizes an accepted question response", async () => {
    const result = broker.request("x.ai/ask_user_question", questionParams());
    const interaction = broker.current(sessionId);
    expect(interaction?.kind).toBe("question");

    expect(
      broker.respond(sessionId, interaction!.id, {
        outcome: "accepted",
        answers: {
          "Which database?": ["Postgres (Recommended)", "not-an-option"],
          "Injected question": ["bad"],
        },
        annotations: {
          "Which database?": { notes: "ignored", preview: "untrusted preview" },
        },
      }),
    ).toBe(true);

    await expect(result).resolves.toEqual({
      outcome: "accepted",
      answers: { "Which database?": ["Postgres (Recommended)"] },
      annotations: { "Which database?": { preview: "CREATE TABLE users (...);" } },
    });
    expect(broker.current(sessionId)).toBeUndefined();
  });

  it("supports plan review feedback", async () => {
    const result = broker.request("x.ai/exit_plan_mode", {
      sessionId,
      toolCallId: "tool-plan-1",
      planContent: "# Plan\n\n1. Add tests",
    });
    const interaction = broker.current(sessionId);
    expect(interaction).toMatchObject({
      kind: "plan",
      planContent: "# Plan\n\n1. Add tests",
    });

    expect(
      broker.respond(sessionId, interaction!.id, {
        outcome: "cancelled",
        feedback: "Cover the error path too.",
      }),
    ).toBe(true);
    await expect(result).resolves.toEqual({
      outcome: "cancelled",
      feedback: "Cover the error path too.",
    });
  });

  it("requires free-form text and keeps it beside multi-select options", async () => {
    const result = broker.request("x.ai/ask_user_question", {
      ...questionParams(),
      questions: [{ ...questionParams().questions[0], multiSelect: true }],
    });
    const interaction = broker.current(sessionId)!;

    expect(
      broker.respond(sessionId, interaction.id, {
        outcome: "accepted",
        answers: { "Which database?": ["Redis", "Other"] },
        annotations: { "Which database?": { notes: "Use Redis for the cache." } },
      }),
    ).toBe(true);
    await expect(result).resolves.toEqual({
      outcome: "accepted",
      answers: { "Which database?": ["Redis"] },
      annotations: { "Which database?": { notes: "Use Redis for the cache." } },
    });

    const emptyOther = broker.request("x.ai/ask_user_question", questionParams());
    const nextInteraction = broker.current(sessionId)!;
    expect(() =>
      broker.respond(sessionId, nextInteraction.id, {
        outcome: "accepted",
        answers: { "Which database?": ["Other"] },
      }),
    ).toThrow("Answer at least one Grok Build question");
    broker.cancelSession(sessionId);
    await expect(emptyOther).resolves.toEqual({ outcome: "cancelled" });
  });

  it("uses safe fallback outcomes when a session is cancelled", async () => {
    const question = broker.request("x.ai/ask_user_question", questionParams());
    broker.cancelSession(sessionId);
    await expect(question).resolves.toEqual({ outcome: "cancelled" });

    const plan = broker.request("x.ai/exit_plan_mode", {
      sessionId,
      toolCallId: "tool-plan-2",
      planContent: "# Plan",
    });
    broker.cancelSession(sessionId);
    await expect(plan).resolves.toEqual({ outcome: "abandoned" });
  });

  it("rejects plan-only question outcomes outside plan mode", () => {
    broker.request("x.ai/ask_user_question", questionParams());
    const interaction = broker.current(sessionId);
    expect(() =>
      broker.respond(sessionId, interaction!.id, {
        outcome: "skip_interview",
        partial_answers: {},
      }),
    ).toThrow("only valid for a plan-mode question");
  });

  it("long-polls until an interaction changes", async () => {
    const appeared = broker.waitForChange(sessionId, undefined, { timeoutMs: 1_000 });
    const response = broker.request("x.ai/ask_user_question", questionParams());
    const interaction = await appeared;
    expect(interaction).toMatchObject({ kind: "question", sessionId });

    const cleared = broker.waitForChange(sessionId, interaction!.id, { timeoutMs: 1_000 });
    expect(
      broker.respond(sessionId, interaction!.id, {
        outcome: "accepted",
        answers: { "Which database?": ["Redis"] },
      }),
    ).toBe(true);
    await expect(cleared).resolves.toBeUndefined();
    await expect(response).resolves.toEqual({
      outcome: "accepted",
      answers: { "Which database?": ["Redis"] },
    });
  });
});
