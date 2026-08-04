import { getDemoConversation } from "./demo-conversations";

const STORAGE_KEY_PREFIX = "openui-chat-demo-forks";

export class DemoForkRegistry {
  private readonly storageKey: string;
  private readonly unseededForks = new Map<string, string>();

  constructor(userId: string) {
    this.storageKey = `${STORAGE_KEY_PREFIX}:${userId}`;
    this.restore();
  }

  register(threadId: string, demoId: string) {
    if (!getDemoConversation(demoId)) return;
    this.unseededForks.set(threadId, demoId);
    this.persist();
  }

  getDemoId(threadId: string): string | undefined {
    return this.unseededForks.get(threadId);
  }

  shouldSeed(threadId: string): boolean {
    return this.unseededForks.has(threadId);
  }

  markSeeded(threadId: string) {
    if (!this.unseededForks.delete(threadId)) return;
    this.persist();
  }

  remove(threadId: string) {
    if (!this.unseededForks.delete(threadId)) return;
    this.persist();
  }

  private restore() {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return;
      const stored = JSON.parse(raw) as Record<string, unknown>;

      for (const [threadId, demoId] of Object.entries(stored)) {
        if (typeof demoId === "string" && getDemoConversation(demoId)) {
          this.unseededForks.set(threadId, demoId);
        }
      }
    } catch {
      // A stale or unavailable local store should not prevent Cloud chat from loading.
    }
  }

  private persist() {
    if (typeof window === "undefined") return;

    try {
      if (this.unseededForks.size === 0) {
        window.localStorage.removeItem(this.storageKey);
        return;
      }

      window.localStorage.setItem(
        this.storageKey,
        JSON.stringify(Object.fromEntries(this.unseededForks)),
      );
    } catch {
      // Persistence is a refresh convenience; the in-memory fork remains usable.
    }
  }
}
