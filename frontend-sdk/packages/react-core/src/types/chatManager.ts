import { CreateMessage, Message, UserMessage } from "./message";
import { ResponseTemplate } from "./responseTemplate";

/**
 * Represents a chat thread
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
 */
export type ThreadActions = {
  processMessage: (message: CreateMessage) => Promise<void>;
  appendMessages: (...messages: Message[]) => void;
  updateMessage: (message: Message) => void;
  onCancel: () => void;
  setMessages: (messages: Message[]) => void;
};

/**
 * Represents the state of a thread
 */
export type ThreadState = {
  /** Indicates if the thread is currently processing and controls should be disabled */
  isRunning?: boolean | undefined;
  messages: Message[];
  error: Error | null | undefined;
  responseTemplates: {
    [name: string]: ResponseTemplate;
  };
};

/**
 * Combines thread state and actions
 * @template T - The message type used in the thread
 */
export type ThreadManager = ThreadState & ThreadActions;

/**
 * Represents the state of the thread list
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
 */
export type ThreadListManager = ThreadListState & ThreadListActions;

/**
 * Main chat manager combining thread and thread list management
 */
export type ChatManager = {
  threadListManager: ThreadListManager;
  threadManager: ThreadManager;
};
