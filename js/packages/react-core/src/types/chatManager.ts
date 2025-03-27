import { CreateMessage, Message, UserMessage } from "./message";
import { ResponseTemplate } from "./responseTemplate";

/**
 * Represents a chat thread
 *
 * @category Types
 */
export type Thread = {
  /** Unique identifier for the thread */
  threadId: string;
  /** Title of the thread */
  title: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Indicates if the thread is currently processing */
  isRunning?: boolean;
};

/**
 * Actions available for managing the state of a thread
 *
 * @category Types
 */
export type ThreadActions = {
  /** Calls the `processMessage` method of the `ThreadManager` to process a new user message and request a response from the agent. If
   * the `useThreadManager` hook was used to create a `ThreadManager`, this method is the same one as the `processMessage` method provided to the hook.
   */
  processMessage: (message: CreateMessage) => Promise<void>;
  /** Appends a new message to the thread */
  appendMessages: (...messages: Message[]) => void;
  /** Updates a message in the thread */
  updateMessage: (message: Message, shouldTriggerCallback?: boolean) => void;
  /** Cancels the current message processing */
  onCancel: () => void;
  /** Sets the messages in the thread */
  setMessages: (messages: Message[]) => void;
  /** Deletes a message from the thread */
  deleteMessage: (messageId: string) => void;
};

/**
 * Represents the state of a thread
 *
 * @category Types
 */
export type ThreadState = {
  /** Indicates if the thread is currently processing and controls should be disabled */
  isRunning?: boolean | undefined;
  /** Indicates if the messages are currently loading */
  isLoadingMessages: boolean | undefined;
  /** The messages in the thread */
  messages: Message[];
  /** The error that occurred during the last message processing */
  error: Error | null | undefined;
  /** The response templates available for the thread. If the {@link useThreadManager} hook was used to create the {@link ThreadManager}, this property is the same one as the
   * `responseTemplates` property provided to the hook.
   */
  responseTemplates: Record<string, ResponseTemplate>;
};

/**
 * @category Types
 */
export type ThreadManager = ThreadState & ThreadActions;

/**
 * Represents the state of the thread list
 *
 * @category Types
 */
export type ThreadListState = {
  /** The list of threads */
  threads: Thread[];
  /** Indicates if the thread list is currently loading */
  isLoading: boolean;
  /** The error that occurred while fetching the thread list */
  error: Error | null | undefined;
  /** The id of the selected / active thread */
  selectedThreadId: string | null;
  /** Indicates if the thread state should be reset when the selected thread changes. This helps clear and update the list of messages on the screen when switching
   * between threads. */
  shouldResetThreadState: boolean;
};

/**
 * Actions available for managing the state of a thread list
 *
 * @category Types
 */
export type ThreadListActions = {
  /** Loads the thread list */
  load: () => void;
  /** Clears the thread state so that the user can start a new thread */
  switchToNewThread: () => void;
  /** Creates a new thread with given `firstMessage` as the user message */
  createThread: (firstMessage: UserMessage) => Promise<Thread>;
  /** Selects a thread */
  selectThread: (threadId: string, shouldResetThreadState?: boolean) => void;
  /** Updates a thread */
  updateThread: (thread: Thread) => void;
  /** Deletes a thread */
  deleteThread: (threadId: string) => void;
};

/**
 * @category Types
 */
export type ThreadListManager = ThreadListState & ThreadListActions;

/**
 * Main chat manager combining thread and thread list management
 *
 * @category Types
 */
export type ChatManager = {
  /** The thread list manager, a combination of thread list state and actions */
  threadListManager: ThreadListManager;
  /** The thread manager, a combination of thread state and actions */
  threadManager: ThreadManager;
};
