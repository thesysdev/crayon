import { describe, expect, it } from "vitest";
import type { AssistantMessage, Message, ToolMessage } from "../../types";
import { evaluateArtifactAutoOpen } from "../artifactAutoOpenWatcher";
import { buildArtifactRendererRegistry } from "../ArtifactRenderersContext";
import type { ArtifactRendererConfig } from "../artifactRendererTypes";
import { createDetailedViewStore } from "../createDetailedViewStore";

// Test renderer: parses `{"id": "...", "version": n}` out of the (possibly
// partial) args and yields meta only once `id` is present — mirroring real
// parsers, whose header arrives a few tokens into the stream.
const artifactRenderer: ArtifactRendererConfig<unknown> = {
  type: "test_artifact",
  toolName: "make_artifact",
  parser: ({ args }) => {
    if (typeof args !== "string") return null;
    let input: { id?: string; version?: number; explode?: boolean };
    try {
      input = JSON.parse(args) as typeof input;
    } catch {
      return { props: {}, meta: null }; // header not parseable yet
    }
    if (input.explode) throw new Error("parser exploded");
    if (!input.id) return { props: {}, meta: null };
    return {
      props: {},
      meta: { id: input.id, version: input.version ?? 1, heading: "t" },
    };
  },
  preview: () => null,
  actual: () => null,
};

const registry = buildArtifactRendererRegistry([artifactRenderer]);

const assistant = (callId: string, args: string, toolName = "make_artifact"): AssistantMessage => ({
  id: `msg-${callId}`,
  role: "assistant",
  toolCalls: [{ id: callId, type: "function", function: { name: toolName, arguments: args } }],
});

const toolResult = (callId: string, error?: string): ToolMessage => ({
  id: `res-${callId}`,
  role: "tool",
  toolCallId: callId,
  content: JSON.stringify({ id: "art", version: 1 }),
  ...(error ? { error } : {}),
});

const run = (
  viewMode: "auto-open" | "open-on-mount" | "overview",
  messages: Message[],
  store = createDetailedViewStore(),
  executing: ReadonlySet<string> = new Set(),
) => {
  evaluateArtifactAutoOpen(
    viewMode,
    registry,
    { messages, executingToolCallIds: executing },
    store.getState(),
  );
  return store;
};

describe("evaluateArtifactAutoOpen", () => {
  it("auto-open: opens a streaming artifact once its header parses", () => {
    const store = run("auto-open", [assistant("c1", '{"id": "art", "version": 1}')]);
    expect(store.getState().activeDetailedViewId).toBe("art:1");
    expect(store.getState()._autoOpenedArtifactKeys.has("c1")).toBe(true);
  });

  it("auto-open: a user close sticks — the same call never re-opens", () => {
    const messages = [assistant("c1", '{"id": "art", "version": 1}')];
    const store = run("auto-open", messages);
    store.getState().setActiveDetailedView(null); // user closes mid-stream
    run("auto-open", messages, store); // next stream update
    expect(store.getState().activeDetailedViewId).toBeNull();
  });

  it("auto-open: does not burn the latch before the header arrives", () => {
    const store = createDetailedViewStore();
    run("auto-open", [assistant("c1", '{"id": "ar')], store); // partial args
    expect(store.getState().activeDetailedViewId).toBeNull();
    expect(store.getState()._autoOpenedArtifactKeys.has("c1")).toBe(false);
    run("auto-open", [assistant("c1", '{"id": "art", "version": 2}')], store);
    expect(store.getState().activeDetailedViewId).toBe("art:2");
  });

  it("auto-open: settled (historical) artifacts stay quiet", () => {
    const store = run("auto-open", [
      assistant("c1", '{"id": "art", "version": 1}'),
      toolResult("c1"),
    ]);
    expect(store.getState().activeDetailedViewId).toBeNull();
  });

  it("auto-open: an executing call (args closed, no result) still opens", () => {
    const store = run(
      "auto-open",
      [assistant("c1", '{"id": "art", "version": 1}')],
      createDetailedViewStore(),
      new Set(["c1"]),
    );
    expect(store.getState().activeDetailedViewId).toBe("art:1");
  });

  it("open-on-mount: settled artifacts open, newest (last) wins", () => {
    const store = run("open-on-mount", [
      assistant("c1", '{"id": "a1", "version": 1}'),
      toolResult("c1"),
      assistant("c2", '{"id": "a2", "version": 1}'),
      toolResult("c2"),
    ]);
    expect(store.getState().activeDetailedViewId).toBe("a2:1");
    expect(store.getState()._autoOpenedArtifactKeys.has("c1")).toBe(true);
  });

  it("overview: never opens anything", () => {
    const store = run("overview", [assistant("c1", '{"id": "art", "version": 1}')]);
    expect(store.getState().activeDetailedViewId).toBeNull();
    expect(store.getState()._autoOpenedArtifactKeys.size).toBe(0);
  });

  it("skips errored tool calls", () => {
    const store = run("open-on-mount", [
      assistant("c1", '{"id": "art", "version": 1}'),
      toolResult("c1", "boom"),
    ]);
    expect(store.getState().activeDetailedViewId).toBeNull();
  });

  it("skips tool calls with no matching renderer", () => {
    const store = run("auto-open", [assistant("c1", '{"id": "art"}', "unrelated_tool")]);
    expect(store.getState().activeDetailedViewId).toBeNull();
  });

  it("a throwing parser is skipped without claiming the latch", () => {
    const store = createDetailedViewStore();
    run("auto-open", [assistant("c1", '{"id": "art", "explode": true}')], store);
    expect(store.getState().activeDetailedViewId).toBeNull();
    expect(store.getState()._autoOpenedArtifactKeys.has("c1")).toBe(false);
  });

  it("thread switch (reset) re-arms open-on-mount for the next thread", () => {
    const messages = [assistant("c1", '{"id": "art", "version": 1}'), toolResult("c1")];
    const store = run("open-on-mount", messages);
    expect(store.getState().activeDetailedViewId).toBe("art:1");
    store.getState().reset();
    expect(store.getState().activeDetailedViewId).toBeNull();
    run("open-on-mount", messages, store);
    expect(store.getState().activeDetailedViewId).toBe("art:1");
  });
});
