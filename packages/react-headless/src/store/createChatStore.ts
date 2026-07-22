import { createStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { ChatLLM, ChatStorage } from "../adapters/types";
import { processStreamedMessage } from "../stream/processStreamedMessage";
import { DRAFT_KEY, buildThreadState, resolveViewKey } from "./threadStateItem";
import type { ChatStore, Message, Thread, ThreadStateEntry, UserMessage } from "./types";

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
    subscribeWithSelector((set, get) => {
      /** The key whose entry the view currently shows. */
      const viewKey = () => resolveViewKey(get().selectedThreadId);

      /**
       * Guarded functional update of one thread's entry. No-ops when the entry
       * is absent (thread deleted) or `fn` returns `null`, so a dropped thread's
       * late `finally`/abort/straggler callbacks can't resurrect a ghost.
       * Spreads preserve every other entry's identity.
       */
      const withThreadState = (
        key: string,
        fn: (cur: ThreadStateEntry) => Partial<ThreadStateEntry> | null,
      ) =>
        set((s) => {
          const cur = s.threadStates[key];
          if (!cur) return s;
          const patch = fn(cur);
          if (!patch) return s;
          return { threadStates: { ...s.threadStates, [key]: { ...cur, ...patch } } };
        });

      /** Guarded merge of a static patch into one thread's entry. */
      const patchThreadState = (key: string, patch: Partial<ThreadStateEntry>) =>
        withThreadState(key, () => patch);

      /** Update one thread's entry, creating it if absent. */
      const upsertThreadState = (
        key: string,
        fn: (cur: ThreadStateEntry) => Partial<ThreadStateEntry>,
      ) =>
        set((s) => {
          const cur = s.threadStates[key] ?? buildThreadState();
          return { threadStates: { ...s.threadStates, [key]: { ...cur, ...fn(cur) } } };
        });

      /** Drop a thread's entry entirely. */
      const dropThreadState = (key: string) =>
        set((s) => {
          if (!(key in s.threadStates)) return s;
          const next = { ...s.threadStates };
          delete next[key];
          return { threadStates: next };
        });

      return {
        // ── Thread List State ──
        threads: [],
        isLoadingThreads: false,
        threadListError: null,
        selectedThreadId: null,
        hasMoreThreads: false,
        isCreatingThread: false,
        _nextCursor: undefined,

        // ── Per-thread State ──
        threadStates: {},

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
          if (get().isCreatingThread) return;
          set({ selectedThreadId: null });
          dropThreadState(DRAFT_KEY);
        },

        createThread: async (firstMessage: UserMessage) => {
          const thread = await threadStorage.createThread(firstMessage);
          set((s) => ({ threads: mergeThreadList(s.threads, [thread]) }));
          return thread;
        },

        selectThread: (threadId: string) => {
          // No abort — the previously-selected thread's run (if any) keeps
          // streaming into its own entry in the background.
          set({ selectedThreadId: threadId });

          // An in-memory entry (live/finished run, or an already-loaded thread)
          // is shown as-is. Never reload: storage may not yet have messages
          // streamed this session.
          if (get().threadStates[threadId]) return;

          upsertThreadState(threadId, () => ({ isLoadingMessages: true }));
          threadStorage
            .getMessages(threadId)
            .then((messages) =>
              // A run started (or the thread was deleted) meanwhile → don't clobber.
              withThreadState(threadId, (cur) =>
                cur.isRunning ? null : { messages, isLoadingMessages: false },
              ),
            )
            .catch((e) => patchThreadState(threadId, { threadError: e, isLoadingMessages: false }));
        },

        updateThread: (thread: Thread) => {
          const setPending = (id: string, isPending: boolean) =>
            set((s) => ({
              threads: s.threads.map((t) => (t.id === id ? { ...t, isPending } : t)),
            }));
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
            set((s) => ({
              threads: s.threads.map((t) => (t.id === id ? { ...t, isPending } : t)),
            }));
          setPending(threadId, true);
          threadStorage
            .deleteThread(threadId)
            .then(() => {
              const state = get();
              state.threadStates[threadId]?.abortController?.abort();
              dropThreadState(threadId);
              set((s) => ({ threads: s.threads.filter((t) => t.id !== threadId) }));
              if (state.selectedThreadId === threadId) {
                get().switchToNewThread();
              }
            })
            .catch(() => setPending(threadId, false));
        },

        // ── Thread Actions ──

        processMessage: async (message) => {
          const startState = get();
          // The run's key: the selected thread, or DRAFT_KEY for a brand-new chat.
          // A mutable local so post-re-key callbacks target the real threadId.
          let requestKey = startState.selectedThreadId ?? DRAFT_KEY;

          // Per-thread concurrency guard: only block if THIS thread is already
          // running. Different threads run concurrently.
          if (startState.threadStates[requestKey]?.isRunning) return;

          const isNewChat = !startState.selectedThreadId;
          const abortController = new AbortController();
          const optimisticMessage: UserMessage = {
            ...message,
            id: crypto.randomUUID(),
            role: "user",
          };

          // Start the request on this thread's entry, preserving any already-loaded
          // messages and appending the optimistic user message.
          if (isNewChat) set({ isCreatingThread: true });
          upsertThreadState(requestKey, (cur) => ({
            messages: [...cur.messages, optimisticMessage],
            isRunning: true,
            threadError: null,
            executingToolCallIds: new Set<string>(),
            abortController,
          }));

          // On abort, flip the request off on its own entry.
          abortController.signal.addEventListener("abort", () => {
            patchThreadState(requestKey, { isRunning: false, abortController: null });
          });

          try {
            if (isNewChat) {
              try {
                const created = await get().createThread(optimisticMessage);
                // Re-key the draft entry to the real threadId, carrying the live
                // run. Follow into the new thread ONLY if the user is still on the
                // draft view — a background re-key must not write selectedThreadId,
                // or ChatProvider would reset the ephemeral stores of the thread
                // the user is now viewing.
                set((s) => {
                  const draft = s.threadStates[DRAFT_KEY];
                  const nextStates = { ...s.threadStates };
                  if (draft) {
                    delete nextStates[DRAFT_KEY];
                    nextStates[created.id] = draft;
                  }
                  const follow = s.selectedThreadId === null;
                  return {
                    threadStates: nextStates,
                    ...(follow ? { selectedThreadId: created.id } : null),
                  };
                });
                requestKey = created.id;
              } finally {
                set({ isCreatingThread: false });
              }
            }

            const response = await llm.send({
              threadId: requestKey,
              messages: get().threadStates[requestKey]?.messages ?? [],
              signal: abortController.signal,
            });

            if (response instanceof Response && !response.ok) {
              throw new Error(`Request failed: ${response.status} ${response.statusText}`);
            }

            await processStreamedMessage({
              response,
              createMessage: (msg) =>
                withThreadState(requestKey, (cur) => ({ messages: [...cur.messages, msg] })),
              updateMessage: (msg) =>
                withThreadState(requestKey, (cur) => ({
                  messages: cur.messages.map((m) => (m.id === msg.id ? msg : m)),
                })),
              // A tool's args have closed (TOOL_CALL_END) → it is now executing.
              // The `null` no-op keeps the Set reference stable when membership is
              // unchanged so `useToolActivities` doesn't re-run needlessly.
              markToolExecuting: (id) =>
                withThreadState(requestKey, (cur) =>
                  cur.executingToolCallIds.has(id)
                    ? null
                    : { executingToolCallIds: new Set(cur.executingToolCallIds).add(id) },
                ),
              // Its result landed (or it errored) → no longer executing.
              clearToolExecuting: (id) =>
                withThreadState(requestKey, (cur) => {
                  if (!cur.executingToolCallIds.has(id)) return null;
                  const next = new Set(cur.executingToolCallIds);
                  next.delete(id);
                  return { executingToolCallIds: next };
                }),
              adapter: llm.streamProtocol,
            });
          } catch (e) {
            if (!abortController.signal.aborted) {
              patchThreadState(requestKey, {
                threadError: e instanceof Error ? e : new Error(String(e)),
              });
            }
          } finally {
            // Clear run flags + any tool calls still flagged "executing" — adapters
            // that emit TOOL_CALL_END without a matching TOOL_CALL_RESULT (e.g.
            // client-side tool calls in the OpenAI adapters) would otherwise leave
            // them stuck.
            patchThreadState(requestKey, {
              isRunning: false,
              abortController: null,
              executingToolCallIds: new Set<string>(),
            });
          }
        },

        appendMessages: (...newMessages: Message[]) =>
          upsertThreadState(viewKey(), (cur) => ({ messages: [...cur.messages, ...newMessages] })),

        updateMessage: (message: Message) =>
          withThreadState(viewKey(), (cur) => ({
            messages: cur.messages.map((m) => (m.id === message.id ? message : m)),
          })),

        setMessages: (messages: Message[]) => upsertThreadState(viewKey(), () => ({ messages })),

        deleteMessage: (messageId: string) =>
          withThreadState(viewKey(), (cur) => ({
            messages: cur.messages.filter((m) => m.id !== messageId),
          })),

        cancelMessage: () => {
          get().threadStates[viewKey()]?.abortController?.abort();
        },
      };
    }),
  );

  return store;
};
