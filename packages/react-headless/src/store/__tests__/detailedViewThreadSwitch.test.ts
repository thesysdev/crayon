import { describe, expect, it, vi } from "vitest";
import { createDetailedViewStore } from "../createDetailedViewStore";
import { makeStore } from "./__helpers/makeStore";

const flushPromises = () => new Promise((r) => setTimeout(r, 0));

describe("detailed-view thread-switch cleanup", () => {
  const setupStores = () => {
    const chatStore = makeStore();
    const detailedViewStore = createDetailedViewStore();

    const unsubscribe = chatStore.subscribe(
      (state) => state.selectedThreadId,
      () => detailedViewStore.getState().reset(),
    );

    return { chatStore, detailedViewStore, unsubscribe };
  };

  it("clears active view when selectThread is called", async () => {
    const { chatStore, detailedViewStore, unsubscribe } = setupStores();

    detailedViewStore.getState().setActiveDetailedView("view-1");
    expect(detailedViewStore.getState().activeDetailedViewId).toBe("view-1");

    chatStore.getState().selectThread("thread-2");
    await flushPromises();

    expect(detailedViewStore.getState().activeDetailedViewId).toBeNull();

    unsubscribe();
  });

  it("clears active view when switchToNewThread is called", async () => {
    const { chatStore, detailedViewStore, unsubscribe } = setupStores();

    chatStore.setState({ selectedThreadId: "thread-1" });
    detailedViewStore.getState().setActiveDetailedView("view-1");

    chatStore.getState().switchToNewThread();
    await flushPromises();

    expect(detailedViewStore.getState().activeDetailedViewId).toBeNull();

    unsubscribe();
  });

  it("clears active view when active thread is deleted", async () => {
    const deleteThread = vi.fn().mockResolvedValue(undefined);
    const chatStore = makeStore({ deleteThread });
    const detailedViewStore = createDetailedViewStore();

    const unsubscribe = chatStore.subscribe(
      (state) => state.selectedThreadId,
      () => detailedViewStore.getState().reset(),
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

    detailedViewStore.getState().setActiveDetailedView("view-1");

    chatStore.getState().deleteThread("thread-1");
    await flushPromises();

    expect(detailedViewStore.getState().activeDetailedViewId).toBeNull();

    unsubscribe();
  });

  it("does not clear active view when re-selecting the same thread", async () => {
    const { chatStore, detailedViewStore, unsubscribe } = setupStores();

    chatStore.setState({ selectedThreadId: "thread-1" });
    await flushPromises();

    detailedViewStore.getState().setActiveDetailedView("view-1");
    expect(detailedViewStore.getState().activeDetailedViewId).toBe("view-1");

    chatStore.getState().selectThread("thread-1");
    await flushPromises();

    expect(detailedViewStore.getState().activeDetailedViewId).toBe("view-1");

    unsubscribe();
  });

  it("handles rapid thread switches cleanly", async () => {
    const getMessages = vi.fn().mockResolvedValue([]);
    const chatStore = makeStore({ getMessages });
    const detailedViewStore = createDetailedViewStore();

    const unsubscribe = chatStore.subscribe(
      (state) => state.selectedThreadId,
      () => detailedViewStore.getState().reset(),
    );

    detailedViewStore.getState().setActiveDetailedView("view-1");

    chatStore.getState().selectThread("thread-1");
    chatStore.getState().selectThread("thread-2");
    chatStore.getState().selectThread("thread-3");
    await flushPromises();

    expect(detailedViewStore.getState().activeDetailedViewId).toBeNull();
    expect(chatStore.getState().selectedThreadId).toBe("thread-3");

    unsubscribe();
  });
});
