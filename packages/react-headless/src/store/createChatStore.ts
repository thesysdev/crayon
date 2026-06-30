import { createStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { ChatLLM, ChatStorage } from "../adapters/types";
import { processStreamedMessage } from "../stream/processStreamedMessage";
import type { ChatStore, Message, Thread, UserMessage } from "./types";

export interface CreateChatStoreConfig {
  storage: ChatStorage;
  llm: ChatLLM;
}

const mergeThreadList = (existing: Thread[], incoming: Thread[]): Thread[] =>
  Array.from(new Map([...existing, ...incoming].map((t) => [t.id, t])).values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

export const createChatStore = (config: CreateChatStoreConfig) => {
  const { storage, llm } = config;
  const { thread: threadStorage } = storage;

  const store = createStore<ChatStore>()(
    subscribeWithSelector((set, get) => ({
      // Thread List State
      threads: [],
      isLoadingThreads: false,
      threadListError: null,
      selectedThreadId: null,
      hasMoreThreads: false,
      _nextCursor: undefined,

      // Thread State
      messages: [],
      isRunning: false,
      isLoadingMessages: false,
      threadError: null,
      executingToolCallIds: new Set<string>(),
      _abortController: null,

      // ── Thread List Actions ──

      loadThreads: () => {
        set({ isLoadingThreads: true, threadListError: null });
        threadStorage
          .listThreads(undefined)
          .then(({ threads = [], nextCursor }) => {
            set({
              threads,
              isLoadingThreads: false,
              _nextCursor: nextCursor,
              hasMoreThreads: nextCursor !== undefined,
            });
          })
          .catch((e) => {
            set({ isLoadingThreads: false, threadListError: e });
          });
      },

      loadMoreThreads: () => {
        const cursor = get()._nextCursor;
        if (cursor === undefined) return;
        threadStorage
          .listThreads(cursor)
          .then(({ threads = [], nextCursor }) => {
            set((s) => ({
              threads: mergeThreadList(s.threads, threads),
              _nextCursor: nextCursor,
              hasMoreThreads: nextCursor !== undefined,
            }));
          })
          .catch((e) => {
            set({ threadListError: e });
          });
      },

      switchToNewThread: () => {
        get().cancelMessage();
        set({
          selectedThreadId: null,
          messages: [],
          threadError: null,
          executingToolCallIds: new Set<string>(),
        });
      },

      createThread: async (firstMessage: UserMessage) => {
        const thread = await threadStorage.createThread(firstMessage);
        set((s) => ({ threads: mergeThreadList(s.threads, [thread]) }));
        return thread;
      },

      selectThread: (threadId: string) => {
        get().cancelMessage();
        set({
          selectedThreadId: threadId,
          messages: [],
          isLoadingMessages: true,
          threadError: null,
          executingToolCallIds: new Set<string>(),
        });
        threadStorage
          .getMessages(threadId)
          .then((messages) => set({ messages, isLoadingMessages: false }))
          .catch((e) => set({ threadError: e, isLoadingMessages: false }));
      },

      updateThread: (thread: Thread) => {
        const setPending = (id: string, isPending: boolean) =>
          set((s) => ({ threads: s.threads.map((t) => (t.id === id ? { ...t, isPending } : t)) }));
        setPending(thread.id, true);
        threadStorage
          .updateThread(thread)
          .then((updated) => {
            set((s) => ({
              threads: s.threads.map((t) => (t.id === updated.id ? updated : t)),
            }));
          })
          .catch(() => setPending(thread.id, false));
      },

      deleteThread: (threadId: string) => {
        const setPending = (id: string, isPending: boolean) =>
          set((s) => ({ threads: s.threads.map((t) => (t.id === id ? { ...t, isPending } : t)) }));
        setPending(threadId, true);
        threadStorage
          .deleteThread(threadId)
          .then(() => {
            const state = get();
            set({ threads: state.threads.filter((t) => t.id !== threadId) });
            if (state.selectedThreadId === threadId) {
              state.switchToNewThread();
            }
          })
          .catch(() => setPending(threadId, false));
      },

      // ── Thread Actions ──

      processMessage: async (message) => {
        const state = get();
        if (state.isRunning) return;

        const abortController = new AbortController();
        const optimisticMessage: UserMessage = {
          ...message,
          id: crypto.randomUUID(),
          role: "user",
        };

        set({
          _abortController: abortController,
          isRunning: true,
          threadError: null,
          executingToolCallIds: new Set<string>(),
        });
        set((s) => ({ messages: [...s.messages, optimisticMessage] }));

        abortController.signal.addEventListener("abort", () => {
          set({ _abortController: null, isRunning: false });
        });

        try {
          let threadId = get().selectedThreadId;

          if (!threadId) {
            const created = await get().createThread(optimisticMessage);
            threadId = created.id;
            set({ selectedThreadId: threadId });
          }

          const response = await llm.send({
            threadId,
            messages: get().messages,
            signal: abortController.signal,
          });

          if (response instanceof Response && !response.ok) {
            throw new Error(`Request failed: ${response.status} ${response.statusText}`);
          }

          await processStreamedMessage({
            response,
            createMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
            updateMessage: (msg) =>
              set((s) => ({
                messages: s.messages.map((m) => (m.id === msg.id ? msg : m)),
              })),
            // A tool's args have closed (TOOL_CALL_END) → it is now executing.
            markToolExecuting: (id) =>
              set((s) =>
                s.executingToolCallIds.has(id)
                  ? s
                  : { executingToolCallIds: new Set(s.executingToolCallIds).add(id) },
              ),
            // Its result landed (or it errored) → no longer executing.
            clearToolExecuting: (id) =>
              set((s) => {
                if (!s.executingToolCallIds.has(id)) return s;
                const next = new Set(s.executingToolCallIds);
                next.delete(id);
                return { executingToolCallIds: next };
              }),
            adapter: llm.streamProtocol,
          });
        } catch (e) {
          if (!abortController.signal.aborted) {
            set({ threadError: e instanceof Error ? e : new Error(String(e)) });
          }
        } finally {
          // Clear any tool calls still flagged "executing" — adapters that emit
          // TOOL_CALL_END without a matching TOOL_CALL_RESULT (e.g. client-side
          // tool calls in the OpenAI adapters) would otherwise leave them stuck
          // in the executing set after the run ends.
          set({
            _abortController: null,
            isRunning: false,
            executingToolCallIds: new Set<string>(),
          });
        }
      },

      appendMessages: (...newMessages: Message[]) => {
        set((s) => ({ messages: [...s.messages, ...newMessages] }));
      },

      updateMessage: (message: Message) => {
        set((s) => ({
          messages: s.messages.map((m) => (m.id === message.id ? message : m)),
        }));
      },

      setMessages: (messages: Message[]) => {
        set({ messages });
      },

      deleteMessage: (messageId: string) => {
        set((s) => ({ messages: s.messages.filter((m) => m.id !== messageId) }));
      },

      cancelMessage: () => {
        get()._abortController?.abort();
      },
    })),
  );

  return store;
};
