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
 * Actions available for managing a thread
 * @template T - The message type used in the thread
 *
 * @category Types
 */
export type ThreadActions = {
  processMessage: (message: CreateMessage) => Promise<void>;
  appendMessages: (...messages: Message[]) => void;
  updateMessage: (message: Message, shouldTriggerCallback?: boolean) => void;
  onCancel: () => void;
  setMessages: (messages: Message[]) => void;
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
  messages: Message[];
  error: Error | null | undefined;
  responseTemplates: {
    [name: string]: ResponseTemplate;
  };
};

/**
 * Combines thread state and actions
 * @template T - The message type used in the thread
 *
 * @category Types
 */
export type ThreadManager = ThreadState & ThreadActions;

/**
 * Represents the state of the thread list
 *
 * @category Types
 */
export type ThreadListState = {
  threads: Thread[];
  isLoading: boolean;
  error: Error | null | undefined;
  selectedThreadId: string | null;
  shouldResetThreadState: boolean;
};

/**
 * Actions available for managing the thread list
 *
 * @category Types
 */
export type ThreadListActions = {
  load: () => void;
  switchToNewThread: () => void;
  createThread: (firstMessage: UserMessage) => Promise<Thread>;
  selectThread: (threadId: string, shouldResetThreadState?: boolean) => void;
  updateThread: (thread: Thread) => void;
  deleteThread: (threadId: string) => void;
};

/**
 * Combines thread list state and actions
 *
 * @category Types
 */
export type ThreadListManager = ThreadListState & ThreadListActions;

/**
 * Main chat manager combining thread and thread list management
 *
 * @category Types
 */
export type ChatManager = {
  threadListManager: ThreadListManager;
  threadManager: ThreadManager;
};
