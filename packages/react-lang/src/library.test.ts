import { observability } from "@openuidev/observability";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";
import { createLibrary, defineComponent } from "./library";
import {
  DEVTOOLS_LIBRARIES_KEY,
  LIBRARY_EVENT_KIND,
  type RegisteredLibrary,
} from "./publishLibrary";

const Dummy = (() => null) as any;

function makeComponent(name: string) {
  return defineComponent({
    name,
    props: z.object({ label: z.string() }),
    description: `${name} component`,
    component: Dummy,
  });
}

function registry(): RegisteredLibrary[] {
  return (
    (globalThis as { [DEVTOOLS_LIBRARIES_KEY]?: RegisteredLibrary[] })[DEVTOOLS_LIBRARIES_KEY] ?? []
  );
}

function clearRegistry(): void {
  delete (globalThis as { [DEVTOOLS_LIBRARIES_KEY]?: RegisteredLibrary[] })[DEVTOOLS_LIBRARIES_KEY];
}

afterEach(() => {
  clearRegistry();
  vi.unstubAllEnvs();
});

describe("createLibrary publish", () => {
  it("stashes the live library and emits a serializable ping", () => {
    const events: unknown[] = [];
    const remove = observability.listenAll((event) => events.push(event));

    const Card = makeComponent("Card");
    const library = createLibrary({ root: "Card", id: "demo", components: [Card] });

    expect(registry()).toEqual([{ key: "demo", library }]);
    expect(events).toHaveLength(1);
    const event = events[0] as {
      detail: Record<string, unknown>;
    };
    expect(event.detail["kind"]).toBe(LIBRARY_EVENT_KIND);
    expect(event.detail["id"]).toBe("demo");
    expect(event.detail["root"]).toBe("Card");
    expect(event.detail["components"]).toEqual(["Card"]);
    expect(event.detail["library"]).toBeUndefined();
    expect(() => JSON.stringify(event.detail)).not.toThrow();

    remove();
  });

  it("replaces a library with the same key on re-create (HMR)", () => {
    const Card = makeComponent("Card");
    createLibrary({ root: "Card", id: "demo", components: [Card] });
    const second = createLibrary({ root: "Card", id: "demo", components: [Card] });

    expect(registry()).toHaveLength(1);
    expect(registry()[0]?.library).toBe(second);
  });

  it("keeps distinct libraries side by side", () => {
    const Card = makeComponent("Card");
    const Stack = makeComponent("Stack");
    createLibrary({ root: "Card", components: [Card] });
    createLibrary({ root: "Stack", components: [Stack] });

    expect(registry().map((entry) => entry.key)).toEqual(["Card", "Stack"]);
  });

  it("does not publish in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const events: unknown[] = [];
    const remove = observability.listenAll((event) => events.push(event));

    createLibrary({ root: "Card", components: [makeComponent("Card")] });

    expect(registry()).toEqual([]);
    expect(events).toEqual([]);
    remove();
  });
});
