import type { Message, UserMessage } from "@openuidev/react-headless";
import { describe, expect, it } from "vitest";
import { createMemoryStorage, createThreadStore } from "./thread-store";

const userMessage = (content: string): UserMessage =>
  ({ id: crypto.randomUUID(), role: "user", content }) as UserMessage;

const assistantMessage = (content: string): Message =>
  ({ id: crypto.randomUUID(), role: "assistant", content }) as Message;

/**
 * Deterministic id generator so assertions don't depend on randomness.
 */
const seqIds = () => {
  let n = 0;
  return () => `thread-${++n}`;
};

describe("thread-store", () => {
  it("gives each new thread a distinct, stable id (no ephemeral collapse)", async () => {
    const store = createThreadStore(createMemoryStorage(), seqIds());

    const a = await store.createThread(userMessage("first conversation"));
    const b = await store.createThread(userMessage("second conversation"));
    const c = await store.createThread(userMessage("third conversation"));

    const ids = [a.id, b.id, c.id];
    expect(new Set(ids).size).toBe(3);
    expect(ids).not.toContain("ephemeral");
  });

  it("persists created threads to the thread list (most recent first)", async () => {
    const store = createThreadStore(createMemoryStorage(), seqIds());

    await store.createThread(userMessage("alpha"));
    await store.createThread(userMessage("beta"));

    const { threads } = await store.fetchThreadList();
    expect(threads.map((t) => t.title)).toEqual(["beta", "alpha"]);
  });

  it("derives a readable title from the first message", async () => {
    const store = createThreadStore(createMemoryStorage(), seqIds());
    const long = "x".repeat(100);

    const short = await store.createThread(userMessage("Build me a dashboard"));
    const truncated = await store.createThread(userMessage(long));

    expect(short.title).toBe("Build me a dashboard");
    expect(truncated.title.endsWith("...")).toBe(true);
    expect(truncated.title.length).toBeLessThanOrEqual(60);
  });

  it("isolates message history per thread", async () => {
    const store = createThreadStore(createMemoryStorage(), seqIds());

    const a = await store.createThread(userMessage("thread A start"));
    const b = await store.createThread(userMessage("thread B start"));

    store.saveMessages(a.id, [userMessage("secret is ALPHA"), assistantMessage("noted ALPHA")]);
    store.saveMessages(b.id, [userMessage("secret is BETA"), assistantMessage("noted BETA")]);

    const loadedA = await store.loadThread(a.id);
    const loadedB = await store.loadThread(b.id);

    expect(JSON.stringify(loadedA)).toContain("ALPHA");
    expect(JSON.stringify(loadedA)).not.toContain("BETA");
    expect(JSON.stringify(loadedB)).toContain("BETA");
    expect(JSON.stringify(loadedB)).not.toContain("ALPHA");
  });

  it("returns an empty history for unknown threads", async () => {
    const store = createThreadStore(createMemoryStorage(), seqIds());
    expect(await store.loadThread("does-not-exist")).toEqual([]);
  });

  it("deletes a thread and its messages", async () => {
    const store = createThreadStore(createMemoryStorage(), seqIds());

    const a = await store.createThread(userMessage("to delete"));
    store.saveMessages(a.id, [userMessage("hello")]);

    await store.deleteThread(a.id);

    expect((await store.fetchThreadList()).threads).toHaveLength(0);
    expect(await store.loadThread(a.id)).toEqual([]);
  });

  it("renames a thread via updateThread", async () => {
    const store = createThreadStore(createMemoryStorage(), seqIds());
    const a = await store.createThread(userMessage("original"));

    await store.updateThread({ ...a, title: "Renamed" });

    const { threads } = await store.fetchThreadList();
    expect(threads[0].title).toBe("Renamed");
  });

  it("survives corrupted storage without throwing", async () => {
    const storage = createMemoryStorage();
    storage.setItem("eve-openui:threads", "{not json");
    const store = createThreadStore(storage, seqIds());

    expect(await store.fetchThreadList()).toEqual({ threads: [] });
    const created = await store.createThread(userMessage("recovers"));
    expect(created.id).toBe("thread-1");
  });
});
