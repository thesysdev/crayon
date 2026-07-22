import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ColorSchemeStorageManager,
  createColorSchemeStore,
  localStorageColorSchemeManager,
} from "../ColorSchemeProvider";
import { ColorSchemeMode, createColorSchemeConfig } from "../colorScheme";

class FakeMediaQueryList {
  matches: boolean;
  readonly media = "(prefers-color-scheme: dark)";
  private readonly listeners = new Set<(event: MediaQueryListEvent) => void>();

  constructor(matches: boolean) {
    this.matches = matches;
  }

  addEventListener(_type: "change", listener: (event: MediaQueryListEvent) => void) {
    this.listeners.add(listener);
  }

  removeEventListener(_type: "change", listener: (event: MediaQueryListEvent) => void) {
    this.listeners.delete(listener);
  }

  addListener(listener: (event: MediaQueryListEvent) => void) {
    this.listeners.add(listener);
  }

  removeListener(listener: (event: MediaQueryListEvent) => void) {
    this.listeners.delete(listener);
  }

  dispatch(matches: boolean) {
    this.matches = matches;
    const event = { matches, media: this.media } as MediaQueryListEvent;
    this.listeners.forEach((listener) => listener(event));
  }

  get listenerCount() {
    return this.listeners.size;
  }
}

type FakeStyle = {
  dataset: Record<string, string>;
  attributes: Map<string, string>;
  textContent: string;
  removed: boolean;
  setAttribute(name: string, value: string): void;
  remove(): void;
};

function installBrowser({ systemDark = false }: { systemDark?: boolean } = {}) {
  const media = new FakeMediaQueryList(systemDark);
  const rootAttributes = new Map<string, string>();
  const styles: FakeStyle[] = [];
  const rootStyle = { colorScheme: "" };

  const fakeDocument = {
    documentElement: {
      style: rootStyle,
      setAttribute(name: string, value: string) {
        rootAttributes.set(name, value);
      },
    },
    body: {},
    head: {
      appendChild(style: FakeStyle) {
        styles.push(style);
      },
    },
    createElement() {
      const style: FakeStyle = {
        dataset: {},
        attributes: new Map(),
        textContent: "",
        removed: false,
        setAttribute(name, value) {
          this.attributes.set(name, value);
        },
        remove() {
          this.removed = true;
        },
      };
      return style;
    },
  };
  const fakeWindow = {
    matchMedia: () => media,
    getComputedStyle: () => ({ getPropertyValue: () => "" }),
    setTimeout(callback: () => void) {
      callback();
      return 1;
    },
  };

  vi.stubGlobal("document", fakeDocument);
  vi.stubGlobal("window", fakeWindow);

  return { media, rootAttributes, rootStyle, styles };
}

function createStorage(initialMode: ColorSchemeMode | null = null) {
  let mode = initialMode;
  let listener: ((mode: ColorSchemeMode | null) => void) | undefined;
  let stopped = false;

  const manager: ColorSchemeStorageManager = {
    get: vi.fn((defaultMode) => mode ?? defaultMode),
    set: vi.fn((nextMode) => {
      mode = nextMode;
    }),
    clear: vi.fn(() => {
      mode = null;
    }),
    subscribe: vi.fn((nextListener) => {
      listener = nextListener;
      return () => {
        stopped = true;
        listener = undefined;
      };
    }),
  };

  return {
    manager,
    emit(nextMode: ColorSchemeMode | null) {
      mode = nextMode;
      listener?.(nextMode);
    },
    get stopped() {
      return stopped;
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("createColorSchemeStore", () => {
  it("hydrates from storage and follows system changes only in system mode", () => {
    const browser = installBrowser({ systemDark: true });
    const storage = createStorage("system");
    const listener = vi.fn();
    const store = createColorSchemeStore({
      config: createColorSchemeConfig(),
      storageManager: storage.manager,
    });

    const unsubscribe = store.subscribe(listener);
    expect(store.getSnapshot()).toEqual({
      mode: "system",
      resolvedMode: "dark",
      systemMode: "dark",
      forcedMode: undefined,
    });
    expect(browser.rootAttributes.get("data-openui-color-scheme")).toBe("dark");
    expect(browser.rootStyle.colorScheme).toBe("dark");

    browser.media.dispatch(false);
    expect(store.getSnapshot().resolvedMode).toBe("light");
    expect(browser.rootAttributes.get("data-openui-color-scheme")).toBe("light");

    store.setMode("light");
    browser.media.dispatch(true);
    expect(store.getSnapshot()).toMatchObject({
      mode: "light",
      resolvedMode: "light",
      systemMode: "dark",
    });
    expect(browser.rootAttributes.get("data-openui-color-scheme")).toBe("light");
    expect(storage.manager.set).toHaveBeenCalledWith("light");

    unsubscribe();
    expect(browser.media.listenerCount).toBe(0);
    expect(storage.stopped).toBe(true);
  });

  it("synchronizes cross-tab changes, deletion, and invalid-value fallback", () => {
    const browser = installBrowser({ systemDark: true });
    const storage = createStorage("light");
    const store = createColorSchemeStore({
      config: createColorSchemeConfig({ defaultMode: "system" }),
      storageManager: storage.manager,
    });

    const unsubscribe = store.subscribe(() => {});
    storage.emit("dark");
    expect(store.getSnapshot().mode).toBe("dark");
    expect(browser.rootAttributes.get("data-openui-color-scheme")).toBe("dark");

    storage.emit(null);
    expect(store.getSnapshot()).toMatchObject({ mode: "system", resolvedMode: "dark" });

    // The default manager normalizes invalid event values to null, which uses
    // the same default-mode path as deleting the storage key.
    storage.emit(null);
    expect(store.getSnapshot().mode).toBe("system");
    unsubscribe();
  });

  it("keeps forced styling non-persistent while saving the selected preference for later", () => {
    const browser = installBrowser({ systemDark: false });
    const storage = createStorage("dark");
    const store = createColorSchemeStore({
      config: createColorSchemeConfig({ forcedMode: "light" }),
      storageManager: storage.manager,
    });

    const unsubscribe = store.subscribe(() => {});
    expect(store.getSnapshot()).toMatchObject({
      mode: "dark",
      resolvedMode: "light",
      forcedMode: "light",
    });

    store.setMode("system");
    browser.media.dispatch(true);
    expect(storage.manager.set).toHaveBeenCalledWith("system");
    expect(store.getSnapshot()).toMatchObject({
      mode: "system",
      resolvedMode: "light",
      systemMode: "dark",
      forcedMode: "light",
    });
    expect(browser.rootAttributes.get("data-openui-color-scheme")).toBe("light");
    unsubscribe();
  });

  it("exposes deterministic server snapshots without pretending storage is server-readable", () => {
    const storage = createStorage("dark");
    const unknownStore = createColorSchemeStore({
      config: createColorSchemeConfig(),
      storageManager: storage.manager,
    });
    expect(unknownStore.getServerSnapshot()).toEqual({
      mode: undefined,
      resolvedMode: undefined,
      systemMode: undefined,
      forcedMode: undefined,
    });

    const knownStore = createColorSchemeStore({
      config: createColorSchemeConfig({ defaultMode: "dark" }),
      storageManager: null,
    });
    expect(knownStore.getServerSnapshot()).toEqual({
      mode: "dark",
      resolvedMode: "dark",
      systemMode: undefined,
      forcedMode: undefined,
    });

    const cookieBackedStore = createColorSchemeStore({
      config: createColorSchemeConfig(),
      storageManager: storage.manager,
      serverMode: "system",
      serverSystemMode: "dark",
    });
    expect(cookieBackedStore.getServerSnapshot()).toEqual({
      mode: "system",
      resolvedMode: "dark",
      systemMode: "dark",
      forcedMode: undefined,
    });

    const forcedStore = createColorSchemeStore({
      config: createColorSchemeConfig({ forcedMode: "light" }),
      storageManager: storage.manager,
    });
    expect(forcedStore.getServerSnapshot()).toMatchObject({
      mode: undefined,
      resolvedMode: "light",
      forcedMode: "light",
    });
  });

  it("keeps a server-readable mode authoritative during client startup", () => {
    installBrowser({ systemDark: false });
    const storage = createStorage("light");
    const store = createColorSchemeStore({
      config: createColorSchemeConfig({ defaultMode: "system" }),
      storageManager: storage.manager,
      serverMode: "dark",
    });

    const unsubscribe = store.subscribe(() => {});
    expect(storage.manager.get).not.toHaveBeenCalled();
    expect(store.getSnapshot()).toMatchObject({ mode: "dark", resolvedMode: "dark" });
    unsubscribe();
  });

  it("adds nonce-bearing transition suppression and removes it after recalculation", () => {
    const browser = installBrowser();
    const storage = createStorage("light");
    const store = createColorSchemeStore({
      config: createColorSchemeConfig({ disableTransitionOnChange: true }),
      storageManager: storage.manager,
      nonce: "transition-nonce",
    });

    const unsubscribe = store.subscribe(() => {});
    store.setMode("dark");
    expect(browser.styles).toHaveLength(1);
    expect(browser.styles[0]?.dataset["openuiDisableThemeTransitions"]).toBe("true");
    expect(browser.styles[0]?.attributes.get("nonce")).toBe("transition-nonce");
    expect(browser.styles[0]?.removed).toBe(true);
    unsubscribe();
  });
});

describe("localStorageColorSchemeManager", () => {
  it("validates persisted values and normalizes storage events", () => {
    const listeners = new Set<(event: StorageEvent) => void>();
    const values = new Map<string, string>([["scheme", "invalid"]]);
    const localStorage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };
    const storageWindow = {
      localStorage,
      addEventListener: (_type: "storage", listener: (event: StorageEvent) => void) =>
        listeners.add(listener),
      removeEventListener: (_type: "storage", listener: (event: StorageEvent) => void) =>
        listeners.delete(listener),
    } as unknown as Window;
    const manager = localStorageColorSchemeManager({ key: "scheme", storageWindow });

    expect(manager.get("system")).toBe("system");
    manager.set("dark");
    expect(manager.get("light")).toBe("dark");

    const received = vi.fn();
    const unsubscribe = manager.subscribe(received);
    listeners.forEach((listener) =>
      listener({ key: "scheme", newValue: "light", storageArea: localStorage } as StorageEvent),
    );
    listeners.forEach((listener) =>
      listener({ key: "scheme", newValue: "invalid", storageArea: localStorage } as StorageEvent),
    );
    listeners.forEach((listener) =>
      listener({ key: null, newValue: null, storageArea: localStorage } as StorageEvent),
    );
    expect(received).toHaveBeenNthCalledWith(1, "light");
    expect(received).toHaveBeenNthCalledWith(2, null);
    expect(received).toHaveBeenNthCalledWith(3, null);

    manager.clear();
    expect(manager.get("light")).toBe("light");
    unsubscribe();
    expect(listeners.size).toBe(0);
  });
});
