import { useMemo, useRef } from "react";
import { createStore, useStore } from "zustand";
import { Thread, ThreadListManager, UserMessage } from "./types";

/**
 * Props for the {@link useThreadListManager} hook
 *
 * @expand
 */
type ThreadListManagerProps = {
  fetchThreadList: () => Promise<Thread[]>;
  deleteThread: (id: string) => Promise<void>;
  updateThread: (updated: Thread) => Promise<Thread>;
  /** Allows user to clear chat state when switched to new thread */
  onSwitchToNew: () => void;
  onSelectThread: (threadId: string) => void;
  createThread: (firstMessage: UserMessage) => Promise<Thread>;
};

type DefaultManager = ThreadListManager;

/**
 * @category Hooks
 *
 * @remarks
 * Some remark
 *
 * @param {ThreadListManagerProps} props - Contains an explanation
 *
 * @returns A ThreadListManager instance
 */
export const useThreadListManager = (props: ThreadListManagerProps): DefaultManager => {
  const propsRef = useRef(props);
  propsRef.current = props;

  const store = useMemo(() => {
    return createStore<DefaultManager>((set) => {
      const updateThreadRunningStatus = (id: string, isRunning: boolean) => {
        set((state) => ({
          threads: state.threads.map((t) => {
            if (t.threadId !== id) {
              return t;
            }
            return {
              ...t,
              isRunning,
            };
          }),
        }));
      };

      return {
        selectedThreadId: null,
        shouldResetThreadState: false,
        threads: [] as Thread[],
        error: null,
        isLoading: true,
        selectThread: (threadId, shouldLoadThread = true) => {
          set({ selectedThreadId: threadId, shouldResetThreadState: shouldLoadThread });
          propsRef.current.onSelectThread(threadId);
        },
        load: () => {
          set({ isLoading: true });
          propsRef.current
            .fetchThreadList()
            .then((threads) => {
              const existingThreads = store.getState().threads;
              set({ isLoading: false, threads: mergeThreadList(existingThreads, threads) });
            })
            .catch((e) => {
              set({ isLoading: false, error: e });
            });
        },
        createThread: async (firstMessage: UserMessage) => {
          const thread = await propsRef.current.createThread(firstMessage);
          set((state) => ({
            threads: mergeThreadList(state.threads, [thread]),
          }));
          return thread;
        },
        deleteThread: (id) => {
          updateThreadRunningStatus(id, true);
          propsRef.current
            .deleteThread(id)
            .then(() => {
              set((state) => ({
                threads: state.threads.filter((t) => t.threadId !== id),
              }));
            })
            .catch(() => {
              updateThreadRunningStatus(id, false);
            });
        },
        updateThread: (thread) => {
          updateThreadRunningStatus(thread.threadId, true);

          propsRef.current
            .updateThread(thread)
            .then((thread) =>
              set((state) => ({
                threads: state.threads.map((t) => (t.threadId === thread.threadId ? thread : t)),
              })),
            )
            .catch(() => {
              updateThreadRunningStatus(thread.threadId, false);
            });
        },
        switchToNewThread: () => {
          set({ selectedThreadId: null, shouldResetThreadState: true });
          propsRef.current.onSwitchToNew();
        },
      };
    });
  }, []);

  return useStore(store);
};

const mergeThreadList = (existingThreads: Thread[], newThreads: Thread[]) => {
  return Array.from(
    new Map([...existingThreads, ...newThreads].map((t) => [t.threadId, t])).values(),
  ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};
