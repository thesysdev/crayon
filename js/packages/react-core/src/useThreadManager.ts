import { useEffect, useMemo, useRef } from "react";
import { createStore, useStore } from "zustand";
import { CreateMessage, Message, ResponseTemplate, ThreadManager } from "./types";

/**
 * Parameters to be passed to the {@link useThreadManager} hook
 *
 * @category Types
 */
export type UseThreadManagerParams = {
  threadId: string | null;
  shouldResetThreadState?: boolean;
  loadThread: (threadId: string) => Promise<Message[]>;
  onProcessMessage: (props: {
    message: CreateMessage;
    threadManager: ThreadManager;
    abortController: AbortController;
  }) => Promise<Message[]>;
  onUpdateMessage?: (props: { message: Message }) => void;
  responseTemplates: ResponseTemplate[];
};

/**
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
        isLoadingMessages: false,
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
        updateMessage: (message: Message) => {
          const messages = store.getState().messages.map((m) => {
            if (m.id === message.id) {
              return message;
            }
            return m;
          });
          propsRef.current.onUpdateMessage?.({ message });
          set({ messages });
        },
        onCancel: () => {
          const abortController = store.getState().abortController;
          if (abortController) {
            abortController.abort();
          }
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
