import { useEffect, useMemo, useRef } from "react";
import { createStore, useStore } from "zustand";
import { CreateMessage, Message, ResponseTemplate, ThreadManager } from "./types";

type Props = {
  threadId: string | null;
  shouldResetThreadState?: boolean;
  loadThread: (threadId: string) => Promise<Message[]>;
  onProcessMessage: (props: {
    message: CreateMessage;
    threadManager: ThreadManager;
    abortController: AbortController;
  }) => Promise<Message[]>;
  responseTemplates: ResponseTemplate[];
};

export const useThreadManager = (props: Props): ThreadManager => {
  const propsRef = useRef(props);
  propsRef.current = props;

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
    if (!props.shouldResetThreadState) {
      return;
    }

    const threadId = props.threadId;
    // cancel any previous requests
    store.getState().onCancel();

    store.setState({ messages: [] });

    if (threadId) {
      store.setState({ isLoadingMessages: true });
      props
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
  }, [props.threadId, props.shouldResetThreadState]);

  return useStore(store);
};
