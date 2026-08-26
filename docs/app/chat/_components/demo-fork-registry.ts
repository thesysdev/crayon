import { getDemoConversation } from "./demo-conversations";

const STORAGE_KEY_PREFIX = "openui-chat-demo-forks";

export class DemoForkRegistry {
  private readonly storageKey: string;
  private readonly demoOrigins = new Map<string, string>();
  private readonly unseededForks = new Set<string>();

  constructor(userId: string) {
    this.storageKey = `${STORAGE_KEY_PREFIX}:${userId}`;
    this.restore();
  }

  register(threadId: string, demoId: string) {
    if (!getDemoConversation(demoId)) return;
    this.demoOrigins.set(threadId, demoId);
    this.unseededForks.add(threadId);
    this.persist();
  }

  getDemoId(threadId: string): string | undefined {
    return this.demoOrigins.get(threadId);
  }

  shouldSeed(threadId: string): boolean {
    return this.unseededForks.has(threadId);
  }

  markSeeded(threadId: string) {
    if (!this.unseededForks.delete(threadId)) return;
    this.persist();
  }

  remove(threadId: string) {
    const removedOrigin = this.demoOrigins.delete(threadId);
    const removedSeed = this.unseededForks.delete(threadId);
    if (!removedOrigin && !removedSeed) return;
    this.persist();
  }

  private restore() {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return;
      const stored = JSON.parse(raw) as Record<string, unknown>;
      if (stored.version === 2) {
        const origins = stored.origins;
        const unseeded = stored.unseeded;
        if (origins && typeof origins === "object") {
          for (const [threadId, demoId] of Object.entries(origins)) {
            if (typeof demoId === "string" && getDemoConversation(demoId)) {
              this.demoOrigins.set(threadId, demoId);
            }
          }
        }
        if (Array.isArray(unseeded)) {
          for (const threadId of unseeded) {
            if (typeof threadId === "string" && this.demoOrigins.has(threadId)) {
              this.unseededForks.add(threadId);
            }
          }
        }
        return;
      }

      // Migrate the original threadId -> demoId map. Every legacy entry was
      // both a demo continuation and still awaiting its first full-history send.
      for (const [threadId, demoId] of Object.entries(stored)) {
        if (typeof demoId === "string" && getDemoConversation(demoId)) {
          this.demoOrigins.set(threadId, demoId);
          this.unseededForks.add(threadId);
        }
      }
    } catch {
      // A stale or unavailable local store should not prevent Cloud chat from loading.
    }
  }

  private persist() {
    if (typeof window === "undefined") return;

    try {
      if (this.demoOrigins.size === 0) {
        window.localStorage.removeItem(this.storageKey);
        return;
      }

      window.localStorage.setItem(
        this.storageKey,
        JSON.stringify({
          version: 2,
          origins: Object.fromEntries(this.demoOrigins),
          unseeded: [...this.unseededForks],
        }),
      );
    } catch {
      // Persistence is a refresh convenience; the in-memory fork remains usable.
    }
  }
}
