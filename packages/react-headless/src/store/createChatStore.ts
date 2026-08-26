import { observability } from "@openuidev/observability";
import { createStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { getResponseErrorMessage } from "../adapters/httpError";
import type { ChatLLM, ChatStorage } from "../adapters/types";
import { processStreamedMessage } from "../stream/processStreamedMessage";
import type { ToolMessage } from "../types/message";
import { buildObservabilityErrorDetail, levelForStatus } from "./observability";
import type { ChatStore, Message, Thread, UserMessage } from "./types";

export interface CreateChatStoreConfig {
  storage: ChatStorage;
  llm: ChatLLM;
}

const mergeThreadList = (existing: Thread[], incoming: Thread[]): Thread[] =>
  Array.from(new Map([...existing, ...incoming].map((t) => [t.id, t])).values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

// Takes the ref itself and reads `current` at call time, so the caller
// (ChatProvider) can refresh `llm` by mutating or replacing `current`.
export const createChatStore = (configRef: React.RefObject<CreateChatStoreConfig>) => {
  const { storage } = configRef.current;
  const { thread: threadStorage } = storage;

  const store = createStore<ChatStore>()(
    subscribeWithSelector((set, get) => {
      const processInput = async (optimisticMessage: UserMessage | ToolMessage) => {
        const state = get();
        if (state.isRunning) return;

        if (optimisticMessage.role === "tool" && !state.selectedThreadId) {
          set({ threadError: new Error("Cannot submit a tool result without an active thread.") });
          return;
        }

        const abortController = new AbortController();

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
            // The guard above guarantees that only a user message can create a
            // thread. Tool results always resume an existing conversation.
            const created = await get().createThread(optimisticMessage as UserMessage);
            threadId = created.id;
            set({ selectedThreadId: threadId });
          }

          const runId = crypto.randomUUID();

          observability.info({
            kind: "LLM:request",
            threadId,
            runId,
            // `message` is reserved by the observability library for strings.
            ...(optimisticMessage.role === "user"
              ? { userMessage: optimisticMessage }
              : { toolMessage: optimisticMessage }),
          });

          let response: Response | null = null;
          try {
            response = await configRef.current.llm.send({
              threadId,
              messages: get().messages,
              signal: abortController.signal,
            });

            observability(levelForStatus(response.status), {
              kind: response.ok ? "LLM:response" : "LLM:error",
              threadId,
              status: response.status,
              ok: response.ok,
              runId,
              ...(await buildObservabilityErrorDetail(response)),
            });

            if (!response.ok) {
              throw new Error(await getResponseErrorMessage(response));
            }
          } catch (e) {
            observability.error({
              kind: "LLM:error",
              threadId,
              runId,
              error: e instanceof Error ? e : new Error(String(e)),
            });
            throw e;
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
            adapter: configRef.current.llm.streamProtocol,
          });
        } catch (e) {
          if (!abortController.signal.aborted) {
            set({ threadError: e instanceof Error ? e : new Error(String(e)) });
          }
        } finally {
          // Clear any tool calls still flagged "executing". A client-rendered
          // tool keeps its pending state in the assistant tool call itself and
          // resumes through processToolResult().
          set({
            _abortController: null,
            isRunning: false,
            executingToolCallIds: new Set<string>(),
          });
        }
      };

      return {
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
          // Re-selecting the active thread is a no-op — don't wipe and refetch.
          if (get().selectedThreadId === threadId) return;
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
              set({ threads: state.threads.filter((t) => t.id !== threadId) });
              if (state.selectedThreadId === threadId) {
                state.switchToNewThread();
              }
            })
            .catch(() => setPending(threadId, false));
        },

        // ── Thread Actions ──

        processMessage: (message) =>
          processInput({
            ...message,
            id: crypto.randomUUID(),
            role: "user",
          }),

        processToolResult: (result) =>
          processInput({
            ...result,
            id: crypto.randomUUID(),
            role: "tool",
          }),

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
      };
    }),
  );

  return store;
};
