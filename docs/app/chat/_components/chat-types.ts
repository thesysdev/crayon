export type ChatMode = "oss" | "cloud";
export type CloudAvailability = "checking" | "available" | "unavailable";

export interface ChatLifecycleState {
  hasConversation: boolean;
  isRunning: boolean;
  isLoading: boolean;
}

export const INITIAL_CHAT_LIFECYCLE: ChatLifecycleState = {
  hasConversation: false,
  isRunning: false,
  isLoading: false,
};
