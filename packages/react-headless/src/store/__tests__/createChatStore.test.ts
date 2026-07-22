import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventType } from "../../types/stream";
import { DRAFT_KEY, buildThreadState } from "../threadStateEntry";
import type { Message, Thread, ThreadStateEntry, UserMessage } from "../types";
import { makeStore } from "./__helpers/makeStore";

// ── Helpers ──

const makeThread = (id: string, daysAgo = 0): Thread => ({
  id,
  title: `Thread ${id}`,
  createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
});

const makeMessage = (id: string, role: "user" | "assistant" = "user"): Message =>
  ({ id, role, content: `msg-${id}` }) as Message;

const flushPromises = () => new Promise((r) => setTimeout(r, 0));

type Store = ReturnType<typeof makeStore>;

// The key whose entry the view currently shows.
const viewKeyOf = (store: Store) => store.getState().selectedThreadId ?? DRAFT_KEY;
// The selected thread's entry (empty defaults when absent), i.e. what `useThread` shows.
const active = (store: Store): ThreadStateEntry =>
  store.getState().threadStates[viewKeyOf(store)] ?? buildThreadState();
// A specific thread's raw entry (may be undefined).
const entryOf = (store: Store, key: string): ThreadStateEntry | undefined =>
  store.getState().threadStates[key];
// Seed/patch one thread's entry, creating it if absent (replaces the old `setState({ messages })`).
const seed = (store: Store, key: string, patch: Partial<ThreadStateEntry>) =>
  store.setState((s) => ({
    threadStates: {
      ...s.threadStates,
      [key]: { ...(s.threadStates[key] ?? buildThreadState()), ...patch },
    },
  }));

// ── Test suite ──

describe("createChatStore", () => {
  // ────────────────────────────────────────────
  // Thread List
  // ────────────────────────────────────────────

  describe("loadThreads", () => {
    it("fetches threads and sets state", async () => {
      const threads = [makeThread("t1"), makeThread("t2", 1)];
      const listThreads = vi.fn().mockResolvedValue({ threads });

      const store = makeStore({ listThreads });

      expect(store.getState().isLoadingThreads).toBe(false);
      store.getState().loadThreads();
      expect(store.getState().isLoadingThreads).toBe(true);

      await flushPromises();

      expect(store.getState().isLoadingThreads).toBe(false);
      expect(store.getState().threads).toHaveLength(2);
      expect(store.getState().hasMoreThreads).toBe(false);
      expect(listThreads).toHaveBeenCalledWith(undefined);
    });

    it("sets threadListError on failure", async () => {
      const error = new Error("network");
      const listThreads = vi.fn().mockRejectedValue(error);

      const store = makeStore({ listThreads });
      store.getState().loadThreads();
      await flushPromises();

      expect(store.getState().isLoadingThreads).toBe(false);
      expect(store.getState().threadListError).toBe(error);
    });

    it("handles pagination cursor", async () => {
      const listThreads = vi.fn().mockResolvedValue({
        threads: [makeThread("t1")],
        nextCursor: "page2",
      });

      const store = makeStore({ listThreads });
      store.getState().loadThreads();
      await flushPromises();

      expect(store.getState().hasMoreThreads).toBe(true);
      expect(listThreads).toHaveBeenCalledWith(undefined);
    });
  });

  describe("loadMoreThreads", () => {
    it("appends threads using cursor", async () => {
      const page1 = [makeThread("t1")];
      const page2 = [makeThread("t2", 1)];
      const listThreads = vi
        .fn()
        .mockResolvedValueOnce({ threads: page1, nextCursor: "c2" })
        .mockResolvedValueOnce({ threads: page2 });

      const store = makeStore({ listThreads });

      store.getState().loadThreads();
      await flushPromises();
      expect(store.getState().threads).toHaveLength(1);

      store.getState().loadMoreThreads();
      await flushPromises();

      expect(store.getState().threads).toHaveLength(2);
      expect(store.getState().hasMoreThreads).toBe(false);
      expect(listThreads).toHaveBeenCalledWith("c2");
    });

    it("no-ops when no more pages", async () => {
      const listThreads = vi.fn().mockResolvedValue({ threads: [makeThread("t1")] });

      const store = makeStore({ listThreads });
      store.getState().loadThreads();
      await flushPromises();

      store.getState().loadMoreThreads();
      await flushPromises();

      expect(listThreads).toHaveBeenCalledTimes(1);
    });
  });

  describe("selectThread", () => {
    it("sets selectedThreadId and loads messages into that thread's entry", async () => {
      const messages: Message[] = [makeMessage("m1"), makeMessage("m2", "assistant")];
      const getMessages = vi.fn().mockResolvedValue(messages);

      const store = makeStore({ getMessages });

      store.getState().selectThread("t1");

      expect(store.getState().selectedThreadId).toBe("t1");
      expect(active(store).messages).toEqual([]);
      expect(active(store).isLoadingMessages).toBe(true);

      await flushPromises();

      expect(active(store).messages).toEqual(messages);
      expect(active(store).isLoadingMessages).toBe(false);
      expect(getMessages).toHaveBeenCalledWith("t1");
    });

    it("does not reload a thread that already has an in-memory entry", async () => {
      const getMessages = vi.fn().mockResolvedValue([makeMessage("stored")]);
      const store = makeStore({ getMessages });

      // Thread already loaded/streamed this session.
      seed(store, "t1", { messages: [makeMessage("in-memory")] });

      store.getState().selectThread("t1");
      await flushPromises();

      expect(active(store).messages.map((m) => m.id)).toEqual(["in-memory"]);
      expect(getMessages).not.toHaveBeenCalled();
    });

    it("sets threadError on load failure", async () => {
      const error = new Error("load failed");
      const getMessages = vi.fn().mockRejectedValue(error);

      const store = makeStore({ getMessages });
      store.getState().selectThread("t1");
      await flushPromises();

      expect(active(store).threadError).toBe(error);
      expect(active(store).isLoadingMessages).toBe(false);
    });
  });

  describe("switchToNewThread", () => {
    it("clears selection and shows an empty draft view", () => {
      const store = makeStore();

      seed(store, "t1", { messages: [makeMessage("m1")], threadError: new Error("old") });
      store.setState({ selectedThreadId: "t1" });

      store.getState().switchToNewThread();

      expect(store.getState().selectedThreadId).toBeNull();
      expect(active(store).messages).toEqual([]);
      expect(active(store).threadError).toBeNull();
    });

    it("is a no-op while a new thread is being created", async () => {
      let resolveCreate!: (t: Thread) => void;
      const createThread = vi.fn().mockImplementation(
        () =>
          new Promise<Thread>((r) => {
            resolveCreate = r;
          }),
      );
      const send = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
      const store = makeStore({
        createThread,
        send,
        streamProtocol: { parse: async function* () {} },
      });

      // Brand-new chat: first message kicks off createThread (still pending).
      store.getState().processMessage({ role: "user", content: "hello" });
      await flushPromises();

      expect(store.getState().isCreatingThread).toBe(true);
      expect(entryOf(store, DRAFT_KEY)?.isRunning).toBe(true);

      // Attempt to start a fresh chat mid-creation → ignored, draft run preserved.
      store.getState().switchToNewThread();
      expect(entryOf(store, DRAFT_KEY)?.isRunning).toBe(true);

      resolveCreate(makeThread("t-real"));
      await flushPromises();

      // Draft re-keyed to the real thread; DRAFT slot freed.
      expect(entryOf(store, DRAFT_KEY)).toBeUndefined();
      expect(entryOf(store, "t-real")).toBeDefined();
      expect(store.getState().isCreatingThread).toBe(false);
    });
  });

  describe("createThread", () => {
    it("adds thread to list", async () => {
      const newThread = makeThread("t-new");
      const createThread = vi.fn().mockResolvedValue(newThread);

      const store = makeStore({ createThread });
      store.setState({ threads: [makeThread("t-existing")] });

      const result = await store.getState().createThread({
        id: "m1",
        role: "user",
        content: "hello",
      } as UserMessage);

      expect(result).toEqual(newThread);
      expect(store.getState().threads).toHaveLength(2);
      expect(store.getState().threads.map((t) => t.id)).toContain("t-new");
    });
  });

  describe("deleteThread", () => {
    it("removes thread from list", async () => {
      const deleteThread = vi.fn().mockResolvedValue(undefined);
      const store = makeStore({ deleteThread });

      store.setState({ threads: [makeThread("t1"), makeThread("t2", 1)] });

      store.getState().deleteThread("t1");
      await flushPromises();

      expect(store.getState().threads).toHaveLength(1);
      expect(store.getState().threads[0].id).toBe("t2");
    });

    it("switches to new thread if deleted thread was selected", async () => {
      const deleteThread = vi.fn().mockResolvedValue(undefined);
      const store = makeStore({ deleteThread });

      seed(store, "t1", { messages: [makeMessage("m1")] });
      store.setState({ threads: [makeThread("t1")], selectedThreadId: "t1" });

      store.getState().deleteThread("t1");
      await flushPromises();

      expect(store.getState().selectedThreadId).toBeNull();
      expect(active(store).messages).toEqual([]);
      expect(entryOf(store, "t1")).toBeUndefined();
    });

    it("aborts an in-flight run on the deleted thread and drops its entry (no ghost)", async () => {
      let capturedSignal: AbortSignal | undefined;
      const send = vi.fn().mockImplementation(({ signal }) => {
        capturedSignal = signal;
        return new Promise(() => {}); // never resolves
      });
      const deleteThread = vi.fn().mockResolvedValue(undefined);
      const store = makeStore({
        send,
        deleteThread,
        streamProtocol: { parse: async function* () {} },
      });

      store.setState({ threads: [makeThread("t1")], selectedThreadId: "t1" });
      store.getState().processMessage({ role: "user", content: "hello" });
      await flushPromises();
      expect(entryOf(store, "t1")?.isRunning).toBe(true);

      store.getState().deleteThread("t1");
      await flushPromises();

      expect(capturedSignal?.aborted).toBe(true);
      expect(entryOf(store, "t1")).toBeUndefined();
      expect(store.getState().threads).toHaveLength(0);

      // Late `finally`/abort callbacks for the dropped key must not resurrect it.
      await flushPromises();
      expect(entryOf(store, "t1")).toBeUndefined();
    });

    it("sets isPending during operation", async () => {
      let resolveDelete: () => void;
      const deleteThread = vi.fn().mockImplementation(
        () =>
          new Promise<void>((r) => {
            resolveDelete = r;
          }),
      );

      const store = makeStore({ deleteThread });
      store.setState({ threads: [makeThread("t1")] });

      store.getState().deleteThread("t1");

      expect(store.getState().threads[0].isPending).toBe(true);

      resolveDelete!();
      await flushPromises();

      expect(store.getState().threads).toHaveLength(0);
    });
  });

  describe("updateThread", () => {
    it("updates thread in list", async () => {
      const updated = { ...makeThread("t1"), title: "Renamed" };
      const updateThread = vi.fn().mockResolvedValue(updated);

      const store = makeStore({ updateThread });
      store.setState({ threads: [makeThread("t1")] });

      store.getState().updateThread(updated);
      await flushPromises();

      expect(store.getState().threads[0].title).toBe("Renamed");
    });
  });

  // ────────────────────────────────────────────
  // Message CRUD (operate on the active view entry)
  // ────────────────────────────────────────────

  describe("message CRUD", () => {
    let store: Store;

    beforeEach(() => {
      store = makeStore();
      // selectedThreadId is null → the active view is the DRAFT entry.
      seed(store, DRAFT_KEY, { messages: [makeMessage("m1"), makeMessage("m2", "assistant")] });
    });

    it("appendMessages adds to end", () => {
      store.getState().appendMessages(makeMessage("m3"));
      expect(active(store).messages).toHaveLength(3);
      expect(active(store).messages[2].id).toBe("m3");
    });

    it("setMessages replaces all", () => {
      store.getState().setMessages([makeMessage("new")]);
      expect(active(store).messages).toHaveLength(1);
      expect(active(store).messages[0].id).toBe("new");
    });

    it("updateMessage replaces by id", () => {
      const updated = { ...makeMessage("m1"), content: "edited" } as Message;
      store.getState().updateMessage(updated);
      expect((active(store).messages[0] as any).content).toBe("edited");
    });

    it("deleteMessage removes by id", () => {
      store.getState().deleteMessage("m1");
      expect(active(store).messages).toHaveLength(1);
      expect(active(store).messages[0].id).toBe("m2");
    });
  });

  // ────────────────────────────────────────────
  // processMessage (calls llm.send)
  // ────────────────────────────────────────────

  describe("processMessage", () => {
    it("appends optimistic user message and calls llm.send", async () => {
      const send = vi.fn().mockResolvedValue(new Response("", { status: 200 }));

      const store = makeStore({ send, streamProtocol: { parse: async function* () {} } });
      store.setState({ selectedThreadId: "t1" });

      await store.getState().processMessage({ role: "user", content: "hello" });

      expect(active(store).messages).toHaveLength(1);
      expect(active(store).messages[0].role).toBe("user");
      expect(active(store).isRunning).toBe(false);
      expect(send).toHaveBeenCalledOnce();
    });

    it("creates thread when none selected and follows into it", async () => {
      const newThread = makeThread("t-auto");
      const createThread = vi.fn().mockResolvedValue(newThread);
      const send = vi.fn().mockResolvedValue(new Response("", { status: 200 }));

      const store = makeStore({
        createThread,
        send,
        streamProtocol: { parse: async function* () {} },
      });

      await store.getState().processMessage({ role: "user", content: "hello" });

      expect(createThread).toHaveBeenCalledOnce();
      expect(store.getState().selectedThreadId).toBe("t-auto");
      expect(entryOf(store, DRAFT_KEY)).toBeUndefined();
      expect(entryOf(store, "t-auto")?.messages).toHaveLength(1);
      expect(store.getState().isCreatingThread).toBe(false);
    });

    it("no-ops when the same thread is already running", async () => {
      const send = vi.fn().mockResolvedValue(new Response("", { status: 200 }));

      const store = makeStore({ send, streamProtocol: { parse: async function* () {} } });
      seed(store, "t1", { isRunning: true });
      store.setState({ selectedThreadId: "t1" });

      await store.getState().processMessage({ role: "user", content: "hello" });

      expect(send).not.toHaveBeenCalled();
    });

    it("sets threadError on failure", async () => {
      const send = vi.fn().mockRejectedValue(new Error("api down"));

      const store = makeStore({ send, streamProtocol: { parse: async function* () {} } });
      store.setState({ selectedThreadId: "t1" });

      await store.getState().processMessage({ role: "user", content: "hello" });

      expect(active(store).threadError).toBeInstanceOf(Error);
      expect(active(store).threadError?.message).toBe("api down");
      expect(active(store).isRunning).toBe(false);
    });
  });

  // ────────────────────────────────────────────
  // cancelMessage
  // ────────────────────────────────────────────

  describe("cancelMessage", () => {
    it("aborts the selected thread's in-flight request", async () => {
      let capturedSignal: AbortSignal;
      const send = vi.fn().mockImplementation(({ signal }) => {
        capturedSignal = signal;
        return new Promise(() => {}); // never resolves
      });

      const store = makeStore({ send, streamProtocol: { parse: async function* () {} } });
      store.setState({ selectedThreadId: "t1" });

      store.getState().processMessage({ role: "user", content: "hello" });

      await flushPromises();
      expect(active(store).isRunning).toBe(true);

      store.getState().cancelMessage();

      await flushPromises();
      expect(active(store).isRunning).toBe(false);
      expect(capturedSignal!.aborted).toBe(true);
    });

    it("does not abort a run on a non-selected (background) thread", async () => {
      const signals: AbortSignal[] = [];
      const send = vi.fn().mockImplementation(({ signal }) => {
        signals.push(signal);
        return new Promise(() => {}); // never resolves
      });
      const store = makeStore({ send, streamProtocol: { parse: async function* () {} } });

      // Run on t1, then switch to t2 (t1 keeps running in background).
      store.setState({ selectedThreadId: "t1" });
      store.getState().processMessage({ role: "user", content: "one" });
      await flushPromises();
      store.getState().selectThread("t2");
      await flushPromises();

      // Cancelling from t2 must not touch t1's run.
      store.getState().cancelMessage();
      await flushPromises();

      expect(signals[0].aborted).toBe(false);
      expect(entryOf(store, "t1")?.isRunning).toBe(true);
    });
  });

  // ────────────────────────────────────────────
  // Background streaming across thread switches
  // ────────────────────────────────────────────

  describe("thread switch while streaming", () => {
    it("keeps the run alive in the background and loads the new thread", async () => {
      let capturedSignal: AbortSignal | undefined;
      const send = vi.fn().mockImplementation(({ signal }) => {
        capturedSignal = signal;
        return new Promise(() => {}); // never resolves
      });
      const newMessages = [makeMessage("new-m1")];
      const getMessages = vi.fn().mockResolvedValue(newMessages);

      const store = makeStore({
        send,
        getMessages,
        streamProtocol: { parse: async function* () {} },
      });
      store.setState({ selectedThreadId: "t1" });

      // Start streaming on t1.
      store.getState().processMessage({ role: "user", content: "hello" });
      await flushPromises();
      expect(active(store).isRunning).toBe(true);

      // Switch to t2 mid-stream — the run must NOT be aborted (behaviour change).
      store.getState().selectThread("t2");

      expect(capturedSignal?.aborted).toBe(false);
      expect(store.getState().selectedThreadId).toBe("t2");
      expect(active(store).isLoadingMessages).toBe(true);
      expect(entryOf(store, "t1")?.isRunning).toBe(true); // t1 still streaming

      await flushPromises();

      expect(active(store).messages).toEqual(newMessages);
      expect(active(store).isLoadingMessages).toBe(false);

      // Switch back to t1 → shows its in-session messages, NO storage reload.
      store.getState().selectThread("t1");
      expect(active(store).isRunning).toBe(true);
      expect(active(store).messages).toHaveLength(1); // the optimistic user message
      expect(getMessages).toHaveBeenCalledTimes(1); // only t2 was loaded
      expect(getMessages).toHaveBeenCalledWith("t2");
      expect(capturedSignal?.aborted).toBe(false);
    });

    it("runs two threads concurrently, each writing only its own entry", async () => {
      const signals: AbortSignal[] = [];
      const send = vi.fn().mockImplementation(({ signal }) => {
        signals.push(signal);
        return new Promise(() => {}); // never resolves
      });
      const store = makeStore({ send, streamProtocol: { parse: async function* () {} } });

      store.setState({ selectedThreadId: "t1" });
      store.getState().processMessage({ role: "user", content: "one" });
      await flushPromises();

      store.getState().selectThread("t2");
      await flushPromises();
      store.getState().processMessage({ role: "user", content: "two" });
      await flushPromises();

      expect(entryOf(store, "t1")?.isRunning).toBe(true);
      expect(entryOf(store, "t2")?.isRunning).toBe(true);
      expect(send).toHaveBeenCalledTimes(2);
      // Distinct runs, distinct controllers.
      expect(signals[0]).not.toBe(signals[1]);
      expect(entryOf(store, "t1")?.messages).toHaveLength(1);
      expect(entryOf(store, "t2")?.messages).toHaveLength(1);
    });

    it("a completed background run's messages survive a switch away and back", async () => {
      const send = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
      // One text chunk → the assistant message is created synchronously (isFirst path).
      const streamProtocol = {
        parse: async function* () {
          yield { type: EventType.TEXT_MESSAGE_CONTENT, delta: "hi there" } as never;
        },
      };
      const getMessages = vi.fn().mockResolvedValue([]);
      const store = makeStore({ send, streamProtocol, getMessages });

      store.setState({ selectedThreadId: "t1" });
      await store.getState().processMessage({ role: "user", content: "hello" });

      // optimistic user + streamed assistant message
      expect(entryOf(store, "t1")?.messages).toHaveLength(2);
      expect(entryOf(store, "t1")?.isRunning).toBe(false);

      store.getState().selectThread("t2");
      await flushPromises();
      store.getState().selectThread("t1");

      expect(active(store).messages).toHaveLength(2);
      expect(getMessages).not.toHaveBeenCalledWith("t1"); // never reloaded from storage
    });

    it("re-keys a draft run to the background when the user navigates away mid-creation", async () => {
      let resolveCreate!: (t: Thread) => void;
      const createThread = vi.fn().mockImplementation(
        () =>
          new Promise<Thread>((r) => {
            resolveCreate = r;
          }),
      );
      const send = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
      const getMessages = vi.fn().mockResolvedValue([]);
      const store = makeStore({
        createThread,
        send,
        getMessages,
        streamProtocol: { parse: async function* () {} },
      });

      // New chat, first message → createThread pending, run under DRAFT.
      store.getState().processMessage({ role: "user", content: "hello" });
      await flushPromises();
      expect(store.getState().isCreatingThread).toBe(true);

      // User selects a saved thread before createThread resolves.
      store.getState().selectThread("saved");
      await flushPromises();

      resolveCreate(makeThread("t-real"));
      await flushPromises();

      // Did NOT follow — still viewing "saved"; the run backgrounds under its real id.
      expect(store.getState().selectedThreadId).toBe("saved");
      expect(entryOf(store, DRAFT_KEY)).toBeUndefined();
      expect(entryOf(store, "t-real")).toBeDefined();
      expect(entryOf(store, "t-real")?.messages).toHaveLength(1);
      expect(store.getState().isCreatingThread).toBe(false);
    });
  });

  // ────────────────────────────────────────────
  // Memory: LRU eviction of idle thread state
  // ────────────────────────────────────────────

  describe("idle thread eviction", () => {
    // MAX_CACHED_THREADS is 20 (module constant in createChatStore).
    it("evicts least-recently-used idle threads beyond the cap on navigation", async () => {
      const getMessages = vi.fn().mockResolvedValue([]);
      const store = makeStore({ getMessages });

      // Visit 25 distinct threads. Each select creates + touches an entry.
      for (let i = 0; i < 25; i++) store.getState().selectThread(`t${i}`);
      await flushPromises();

      // Selected (t24) + the 20 most-recently-used idle (t4..t23) survive; the 4
      // oldest idle (t0..t3) are evicted.
      expect(entryOf(store, "t0")).toBeUndefined();
      expect(entryOf(store, "t3")).toBeUndefined();
      expect(entryOf(store, "t4")).toBeDefined();
      expect(entryOf(store, "t23")).toBeDefined();
      expect(entryOf(store, "t24")).toBeDefined(); // selected
      expect(Object.keys(store.getState().threadStates)).toHaveLength(21);
    });

    it("reloads an evicted thread from storage when re-selected", async () => {
      const stored = [makeMessage("from-storage")];
      const getMessages = vi.fn().mockResolvedValue(stored);
      const store = makeStore({ getMessages });

      for (let i = 0; i < 25; i++) store.getState().selectThread(`t${i}`);
      await flushPromises();
      expect(entryOf(store, "t0")).toBeUndefined(); // evicted

      // Re-selecting a dropped thread reloads it (no in-memory entry to reuse).
      store.getState().selectThread("t0");
      await flushPromises();
      expect(entryOf(store, "t0")?.messages).toEqual(stored);
    });

    it("never evicts a running thread, even as the least-recently-used", async () => {
      const send = vi.fn().mockImplementation(() => new Promise(() => {})); // never resolves
      const getMessages = vi.fn().mockResolvedValue([]);
      const store = makeStore({ send, getMessages, streamProtocol: { parse: async function* () {} } });

      // Start a background run on "runner", then let it fall to the back of the LRU.
      store.getState().selectThread("runner");
      await flushPromises();
      store.getState().processMessage({ role: "user", content: "go" });
      await flushPromises();
      expect(entryOf(store, "runner")?.isRunning).toBe(true);

      for (let i = 0; i < 25; i++) store.getState().selectThread(`o${i}`);
      await flushPromises();

      // Oldest entry, but protected because it's still running.
      expect(entryOf(store, "runner")).toBeDefined();
      expect(entryOf(store, "runner")?.isRunning).toBe(true);
    });
  });
});
