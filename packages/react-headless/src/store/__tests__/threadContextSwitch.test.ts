import { describe, expect, it, vi } from "vitest";
import { createThreadContextStore } from "../createThreadContextStore";
import { makeStore } from "./__helpers/makeStore";

const flushPromises = () => new Promise((r) => setTimeout(r, 0));

describe("thread-context thread-switch cleanup", () => {
  const setupStores = () => {
    const chatStore = makeStore();
    const threadContextStore = createThreadContextStore();

    const unsubscribe = chatStore.subscribe(
      (state) => state.selectedThreadId,
      () => threadContextStore.getState().reset(),
    );

    return { chatStore, threadContextStore, unsubscribe };
  };

  const populate = (store: ReturnType<typeof createThreadContextStore>) => {
    store
      .getState()
      .registerArtifact({ id: "app-1", version: 1, heading: "App", type: "th_dashboard" });
    store
      .getState()
      .registerArtifact({ id: "art-1", version: 1, heading: "Artifact", type: "th_presentation" });
  };

  const expectEmpty = (store: ReturnType<typeof createThreadContextStore>) => {
    expect(store.getState().artifacts).toEqual({});
  };

  it("clears thread context when selectThread is called", async () => {
    const { chatStore, threadContextStore, unsubscribe } = setupStores();

    populate(threadContextStore);

    chatStore.getState().selectThread("thread-2");
    await flushPromises();

    expectEmpty(threadContextStore);

    unsubscribe();
  });

  it("clears thread context when switchToNewThread is called", async () => {
    const { chatStore, threadContextStore, unsubscribe } = setupStores();

    chatStore.setState({ selectedThreadId: "thread-1" });
    populate(threadContextStore);

    chatStore.getState().switchToNewThread();
    await flushPromises();

    expectEmpty(threadContextStore);

    unsubscribe();
  });

  it("clears thread context when active thread is deleted", async () => {
    const deleteThread = vi.fn().mockResolvedValue(undefined);
    const chatStore = makeStore({ deleteThread });
    const threadContextStore = createThreadContextStore();

    const unsubscribe = chatStore.subscribe(
      (state) => state.selectedThreadId,
      () => threadContextStore.getState().reset(),
    );

    chatStore.setState({
      selectedThreadId: "thread-1",
      threads: [
        {
          id: "thread-1",
          title: "Test",
          createdAt: new Date().toISOString(),
        },
      ],
    });

    populate(threadContextStore);

    chatStore.getState().deleteThread("thread-1");
    await flushPromises();

    expectEmpty(threadContextStore);

    unsubscribe();
  });

  it("does not clear thread context when re-selecting the same thread", async () => {
    const { chatStore, threadContextStore, unsubscribe } = setupStores();

    chatStore.setState({ selectedThreadId: "thread-1" });
    await flushPromises();

    populate(threadContextStore);

    chatStore.getState().selectThread("thread-1");
    await flushPromises();

    expect(threadContextStore.getState().artifacts["app-1"]?.length).toBe(1);
    expect(threadContextStore.getState().artifacts["art-1"]?.length).toBe(1);

    unsubscribe();
  });

  it("handles rapid thread switches cleanly", async () => {
    const getMessages = vi.fn().mockResolvedValue([]);
    const chatStore = makeStore({ getMessages });
    const threadContextStore = createThreadContextStore();

    const unsubscribe = chatStore.subscribe(
      (state) => state.selectedThreadId,
      () => threadContextStore.getState().reset(),
    );

    populate(threadContextStore);

    chatStore.getState().selectThread("thread-1");
    chatStore.getState().selectThread("thread-2");
    chatStore.getState().selectThread("thread-3");
    await flushPromises();

    expectEmpty(threadContextStore);
    expect(chatStore.getState().selectedThreadId).toBe("thread-3");

    unsubscribe();
  });
});
