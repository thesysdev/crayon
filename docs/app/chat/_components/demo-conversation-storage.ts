import type { ChatStorage } from "@openuidev/react-headless";
import { cloneDemoMessages, getDemoConversation } from "./demo-conversations";
import type { DemoForkRegistry } from "./demo-fork-registry";

export function createDemoConversationStorage(
  cloudStorage: ChatStorage,
  forkRegistry: DemoForkRegistry,
): ChatStorage {
  return {
    ...cloudStorage,
    thread: {
      ...cloudStorage.thread,
      async getMessages(threadId) {
        const directDemo = getDemoConversation(threadId);
        if (directDemo) return cloneDemoMessages(directDemo);

        const forkedDemoId = forkRegistry.getDemoId(threadId);
        const forkedDemo = getDemoConversation(forkedDemoId);
        if (forkedDemo) return cloneDemoMessages(forkedDemo);

        return cloudStorage.thread.getMessages(threadId);
      },
      async deleteThread(threadId) {
        try {
          await cloudStorage.thread.deleteThread(threadId);
        } finally {
          forkRegistry.remove(threadId);
        }
      },
    },
  };
}
