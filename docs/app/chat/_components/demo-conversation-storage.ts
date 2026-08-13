import type { ChatStorage } from "@openuidev/react-headless";
import {
  cloneDemoMessages,
  DEMO_ARTIFACTS,
  getDemoArtifact,
  getDemoConversation,
} from "./demo-conversations";
import type { DemoForkRegistry } from "./demo-fork-registry";

export function createDemoConversationStorage(
  cloudStorage: ChatStorage,
  forkRegistry: DemoForkRegistry,
): ChatStorage {
  const cloudArtifactStorage = cloudStorage.artifact;

  return {
    ...cloudStorage,
    thread: {
      ...cloudStorage.thread,
      async getMessages(threadId) {
        const directDemo = getDemoConversation(threadId);
        if (directDemo) return cloneDemoMessages(directDemo);

        const forkedDemoId = forkRegistry.getDemoId(threadId);
        const forkedDemo = getDemoConversation(forkedDemoId);
        if (forkedDemo) {
          try {
            const persistedMessages = await cloudStorage.thread.getMessages(threadId);
            if (persistedMessages.length > 0) return persistedMessages;
          } catch {
            // A newly-created continuation has no stored messages until its first response.
          }
          return cloneDemoMessages(forkedDemo);
        }

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
    ...(cloudArtifactStorage
      ? {
          artifact: {
            async list(params) {
              let cloudResult: Awaited<ReturnType<typeof cloudArtifactStorage.list>> = {
                artifacts: [],
              };
              try {
                cloudResult = await cloudArtifactStorage.list(params);
              } catch {
                // Keep the built-in examples available when Cloud storage is unavailable.
              }
              if (params?.cursor) return cloudResult;

              const query = params?.name?.trim().toLowerCase();
              const demoArtifacts = DEMO_ARTIFACTS.filter(
                (artifact) =>
                  (!query || artifact.title.toLowerCase().includes(query)) &&
                  (!params?.type || params.type.includes(artifact.type)),
              ).map(({ content: _content, program: _program, ...artifact }) => artifact);
              const demoIds = new Set<string>(demoArtifacts.map((artifact) => artifact.id));

              return {
                artifacts: [
                  ...demoArtifacts,
                  ...cloudResult.artifacts.filter((artifact) => !demoIds.has(artifact.id)),
                ],
                nextCursor: cloudResult.nextCursor,
              };
            },
            async get(id) {
              const demoArtifact = getDemoArtifact(id);
              if (demoArtifact) return structuredClone(demoArtifact);
              return cloudArtifactStorage.get(id);
            },
            async update(patch) {
              if (getDemoArtifact(patch.id)) {
                throw new Error("Demo artifacts are read-only.");
              }
              return cloudArtifactStorage.update(patch);
            },
          },
        }
      : {}),
  };
}
