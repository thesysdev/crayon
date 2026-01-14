import { useEffect, useMemo, useRef } from "react";
import { createStore, useStore } from "zustand";
import { CreateMessage, Message, ResponseTemplate, ThreadManager } from "./types";

/**
 * Parameters to be passed to the {@link useThreadManager} hook
 *
 * @category Types
 */
export type UseThreadManagerParams = {
  /** Unique identifier for the thread. If the thread is not created yet, the value should be `null` */
  threadId: string | null;
  /** Whether to reset the thread state when switching to a new thread */
  shouldResetThreadState?: boolean;
  /** A function that defines how the thread should be loaded. Useful for integrating a backend API to load a thread. */
  loadThread: (threadId: string) => Promise<Message[]>;
  /** A function that defines how message should be processed. Useful for integrating a backend API to process a message and request the agent for the response */
  onProcessMessage: (props: {
    message: CreateMessage;
    threadManager: ThreadManager;
    abortController: AbortController;
  }) => Promise<Message[]>;
  /** A function that defines how a message should be updated. Useful for integrating a backend API to update a message. */
  onUpdateMessage?: (props: { message: Message }) => void;
  /** A list of response templates available to the thread. */
  responseTemplates: ResponseTemplate[];
};

/**
 * `useThreadManager` takes the necessary arguments and helps create a {@link ThreadManager} instance. This instance is necessary to define how a thread should
 * be loaded and how a message in the thread should be processed or updated. This can be useful for multiple reasons, including but not limited to:
 *
 * - The hook makes it incredibly easy to manage the thread and does not require you to implement a thread manager from scratch manually
 * - You can use the thread manager to load a thread from a backend API
 * - You can use the thread manager to process a message and request the agent for the response
 * - You can use the thread manager to update a message
 *
 * @category Hooks
 * @returns The thread manager
 */
export const useThreadManager = (params: UseThreadManagerParams): ThreadManager => {
  const propsRef = useRef(params);
  propsRef.current = params;

  const store = useMemo(() => {
    return createStore<
      ThreadManager & {
        abortController: AbortController | null;
      }
    >((set) => {
      return {
        messages: [] as Message[],
        error: null,
        abortController: null,
        isRunning: false,
        isLoadingMessages: true,
        setMessages: (messages: Message[]) => {
          set({ messages });
        },
        appendMessages: (...messages: Message[]) => {
          set({ messages: [...store.getState().messages, ...messages] });
        },
        processMessage: async (message: CreateMessage) => {
          const abortController = new AbortController();
          const threadManager = store.getState();
          if (threadManager.isRunning) {
            return;
          }

          set({ abortController, isRunning: true });
          abortController.signal.addEventListener("abort", () => {
            set({ abortController: null, isRunning: false });
          });

          try {
            const newMessages = await propsRef.current.onProcessMessage({
              message,
              threadManager: store.getState(),
              abortController,
            });

            store.getState().appendMessages(...newMessages);
          } finally {
            set({ abortController: null, isRunning: false });
          }
        },
        updateMessage: (message: Message, shouldTriggerCallback?: boolean) => {
          const messages = store.getState().messages.map((m) => {
            if (m.id === message.id) {
              return message;
            }
            return m;
          });

          if (shouldTriggerCallback) {
            propsRef.current.onUpdateMessage?.({ message });
          }

          set({ messages });
        },
        onCancel: () => {
          const abortController = store.getState().abortController;
          if (abortController) {
            abortController.abort();
          }
        },
        deleteMessage: (messageId: string) => {
          const messages = store.getState().messages.filter((m) => m.id !== messageId);
          set({ messages });
        },
        responseTemplates: propsRef.current.responseTemplates.reduce(
          (acc, template) => {
            acc[template.name] = template;
            return acc;
          },
          {} as { [name: string]: ResponseTemplate },
        ),
      };
    });
  }, [propsRef]);

  useEffect(() => {
    if (!params.shouldResetThreadState) {
      return;
    }

    const threadId = params.threadId;
    // cancel any previous requests
    store.getState().onCancel();

    store.setState({ messages: [] });

    if (threadId) {
      store.setState({ isLoadingMessages: true });
      params
        .loadThread(threadId)
        .then((messages) => {
          store.setState({ messages });
        })
        .catch((error) => {
          store.setState({ error });
        })
        .finally(() => {
          store.setState({ isLoadingMessages: false });
        });
    }
  }, [params.threadId, params.shouldResetThreadState]);

  return useStore(store);
};
