// @vitest-environment jsdom
import { observability, toErrorInfo } from "@openuidev/observability";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OpenUIDevtools, type OpenUIDevtoolsProps } from "./index";

vi.mock("@openuidev/react-lang", async () => {
  const { createElement: el } = await import("react");
  const parse = (src: string) => ({
    root: /\broot\s*=/.test(src)
      ? { type: "element" as const, typeName: "Card", props: {}, partial: false }
      : null,
    meta: {
      incomplete: false,
      unresolved: [] as string[],
      orphaned: [] as string[],
      statementCount: src.trim() ? 1 : 0,
      errors: [] as unknown[],
    },
  });
  return {
    LANG_CORE_VERSION: "9.9.9",
    Renderer: (props: { response: string | null }) =>
      el("div", { "data-testid": "openui-renderer" }, props.response ?? ""),
    createParser: () => ({ parse }),
    createStreamingParser: () => {
      let buf = "";
      return {
        push: (chunk: string) => {
          buf += chunk;
          return parse(buf);
        },
        getResult: () => parse(buf),
      };
    },
  };
});

const LIBRARIES_KEY = Symbol.for("openui.devtools.libraries");

function seedLibrary(): void {
  (
    globalThis as {
      [LIBRARIES_KEY]?: {
        key: string;
        library: {
          root: string;
          components: Record<string, unknown>;
          toJSONSchema: () => unknown;
        };
      }[];
    }
  )[LIBRARIES_KEY] = [
    {
      key: "Card",
      library: {
        root: "Card",
        components: { Card: {} },
        toJSONSchema: () => ({ $defs: { Card: { type: "object", properties: {} } } }),
      },
    },
  ];
}

function clearLibraries(): void {
  delete (globalThis as { [LIBRARIES_KEY]?: unknown })[LIBRARIES_KEY];
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  window.localStorage.clear();
  clearLibraries();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(props: OpenUIDevtoolsProps): void {
  act(() => root.render(createElement(OpenUIDevtools, props)));
}

/** The floating toggle button. */
function toggle(): HTMLButtonElement {
  const button = container.querySelector<HTMLButtonElement>(
    'button[aria-label="Open OpenUI devtools"]',
  );
  if (!button) throw new Error("toggle button not found");
  return button;
}

function click(el: Element): void {
  act(() => el.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

function buttonByText(text: string): HTMLButtonElement | undefined {
  return [...container.querySelectorAll("button")].find((b) => b.textContent === text) as
    HTMLButtonElement | undefined;
}

function openPasteButton(): HTMLButtonElement | undefined {
  return (
    container.querySelector<HTMLButtonElement>('button[aria-label="Open OpenUI Paste"]') ??
    undefined
  );
}

/** The display filters live behind the header settings button. */
function openSettings(): void {
  const button = container.querySelector<HTMLButtonElement>(
    'button[aria-label="Devtools settings"]',
  );
  if (!button) throw new Error("settings button not found");
  click(button);
}

function checkboxLabeled(text: string): HTMLInputElement {
  const label = [...container.querySelectorAll("label")].find((el) =>
    el.textContent?.includes(text),
  );
  const input = label?.querySelector<HTMLInputElement>('input[type="checkbox"]');
  if (!input) throw new Error(`checkbox "${text}" not found`);
  return input;
}

function remount(props: OpenUIDevtoolsProps): void {
  act(() => root.unmount());
  root = createRoot(container);
  render(props);
}

describe("OpenUIDevtools", () => {
  it("renders nothing when disabled", () => {
    render({ enabled: false });
    expect(container.childElementCount).toBe(0);
  });

  it("renders the toggle and opens the drawer on click", () => {
    render({ enabled: true });
    expect(toggle().getAttribute("aria-expanded")).toBe("false");

    click(toggle());
    expect(toggle().getAttribute("aria-expanded")).toBe("true");
  });

  it("lists an emitted error event and shows the error-count badge", () => {
    render({ enabled: true, errorsOnly: false });
    act(() => observability.error({ kind: "boom", error: toErrorInfo(new Error("kaboom")) }));

    expect(container.textContent).toContain("boom");
    // Badge count of error-severity events.
    expect(toggle().textContent).toContain("1");
  });

  it("auto-opens the drawer on an error when autoOpenOnError is true", () => {
    render({ enabled: true, autoOpenOnError: true });
    expect(toggle().getAttribute("aria-expanded")).toBe("false");

    act(() => observability.error({ kind: "boom" }));
    expect(toggle().getAttribute("aria-expanded")).toBe("true");
  });

  it("does not auto-open when autoOpenOnError is false", () => {
    render({ enabled: true, autoOpenOnError: false });
    act(() => observability.error({ kind: "boom" }));
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
  });

  it("restores auto-open on error from a previous session", () => {
    render({ enabled: true, autoOpenOnError: true });
    openSettings();
    expect(checkboxLabeled("Auto-open on error").checked).toBe(true);

    act(() => checkboxLabeled("Auto-open on error").click());
    expect(checkboxLabeled("Auto-open on error").checked).toBe(false);

    remount({ enabled: true, autoOpenOnError: true });
    openSettings();
    expect(checkboxLabeled("Auto-open on error").checked).toBe(false);

    act(() => observability.error({ kind: "boom" }));
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
  });

  it("restores the errors-only filter from a previous session", () => {
    render({ enabled: true, errorsOnly: false });
    openSettings();
    act(() => checkboxLabeled("Errors only").click());
    expect(checkboxLabeled("Errors only").checked).toBe(true);

    remount({ enabled: true, errorsOnly: false });
    openSettings();
    expect(checkboxLabeled("Errors only").checked).toBe(true);

    act(() => observability.info({ kind: "just-info" }));
    act(() => observability.error({ kind: "real-error" }));
    expect(container.textContent).not.toContain("just-info");
    expect(container.textContent).toContain("real-error");
  });

  it("filters out info events when errorsOnly is set", () => {
    render({ enabled: true, errorsOnly: true });
    act(() => observability.info({ kind: "just-info" }));
    act(() => observability.warn({ kind: "useful-warning" }));
    act(() => observability.error({ kind: "real-error" }));

    expect(container.textContent).not.toContain("just-info");
    expect(container.textContent).toContain("useful-warning");
    expect(container.textContent).toContain("real-error");
  });

  it("coalesces successive snapshots of any event with a stable id", () => {
    render({ enabled: true, errorsOnly: false });

    act(() =>
      observability.info({
        id: "job-1",
        kind: "job:progress",
        message: "Starting",
      }),
    );
    act(() =>
      observability.warn({
        id: "job-1",
        kind: "job:progress",
        message: "Needs attention",
      }),
    );

    expect(container.textContent?.match(/job:progress/g)).toHaveLength(1);
    expect(container.textContent).not.toContain("Starting");
    expect(container.textContent).toContain("Needs attention");
  });

  it("drills into the stack trace when a row's Stack Trace is clicked", () => {
    render({ enabled: true, errorsOnly: false });
    act(() => observability.error({ kind: "boom", error: toErrorInfo(new Error("kaboom")) }));

    const stackButton = buttonByText("Stack Trace");
    expect(stackButton).toBeDefined();
    click(stackButton!);

    expect(container.textContent).toContain("stack trace");
  });

  it("coalesces react-lang stream updates by their stable event id", () => {
    render({ enabled: true, errorsOnly: false });

    act(() =>
      observability.info({
        kind: "react-lang:stream",
        id: "stream-1",
        phase: "streaming",
        updateIndex: 1,
        response: "root = Car",
        parser: { statementCount: 1, orphaned: [] },
      }),
    );
    act(() =>
      observability.info({
        kind: "react-lang:stream",
        id: "stream-1",
        phase: "streaming",
        updateIndex: 2,
        response: 'root = Card("done")',
        parser: { statementCount: 2, orphaned: ["unused"] },
      }),
    );

    expect(container.textContent?.match(/OpenUI Lang stream/g)).toHaveLength(1);
    expect(container.querySelector('[aria-label="info"]')).not.toBeNull();
    expect(container.textContent).toContain("Streaming");
    expect(container.textContent).toContain("2 statements");
    expect(container.textContent).toContain("1 orphaned statement");
    expect(container.textContent).not.toContain("stream-1");
    expect(container.textContent).not.toContain('root = Card("done")');

    const expand = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Toggle OpenUI Lang stream details"]',
    );
    expect(expand).not.toBeNull();
    click(expand!);

    expect(container.textContent).toContain('root = Card("done")');
    expect(container.textContent).toContain("Orphaned: unused");
  });

  it("replaces a stream update with its settled diagnostics", () => {
    render({ enabled: true, errorsOnly: false });

    act(() =>
      observability.info({
        kind: "react-lang:stream",
        id: "stream-1",
        phase: "streaming",
        updateIndex: 1,
        response: "root = Ghost()",
      }),
    );
    act(() =>
      observability.error({
        kind: "react-lang:stream",
        id: "stream-1",
        phase: "settled",
        updateIndex: 1,
        response: "root = Ghost()",
        parser: { statementCount: 1, orphaned: [] },
        errors: [
          {
            source: "parser",
            code: "unknown-component",
            message: "Unknown component Ghost",
            component: "Ghost",
            statementId: "root",
            hint: "Use a component registered in the library",
          },
        ],
      }),
    );

    expect(container.textContent?.match(/OpenUI Lang stream/g)).toHaveLength(1);
    expect(container.textContent).not.toContain("settled");
    expect(container.textContent).not.toContain("Streaming");
    expect(container.textContent).toContain("1 statement");
    expect(container.textContent).toContain("1 error");
    expect(container.textContent).not.toContain("Unknown component Ghost");

    const expand = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Toggle OpenUI Lang stream details"]',
    );
    expect(expand).not.toBeNull();
    click(expand!);

    expect(container.textContent).toContain("parser / unknown-component");
    expect(container.textContent).toContain("Unknown component Ghost");
    expect(container.textContent).toContain("Use a component registered in the library");
    expect(container.textContent).toContain("root = Ghost()");
    expect(toggle().textContent).toContain("1");
  });

  it("debugs a stream response in OpenUI Paste", () => {
    seedLibrary();
    render({ enabled: true, errorsOnly: false });
    act(() =>
      observability.info({
        kind: "react-lang:stream",
        id: "stream-1",
        phase: "settled",
        response: 'root = Card("from stream")',
        parser: { statementCount: 1, orphaned: [] },
        errors: [],
      }),
    );

    click(
      container.querySelector<HTMLButtonElement>(
        'button[aria-label="Toggle OpenUI Lang stream details"]',
      )!,
    );
    click(container.querySelector('button[aria-label="Debug"]')!);

    const editor = container.querySelector<HTMLTextAreaElement>(
      'textarea[aria-label="OpenUI Lang"]',
    );
    expect(container.querySelector('[aria-label="OpenUI Paste"]')).not.toBeNull();
    expect(editor?.value).toBe('root = Card("from stream")');
  });

  it("hides provisional errors while the stream is still running", () => {
    render({ enabled: true, errorsOnly: false });

    act(() =>
      observability.info({
        kind: "react-lang:stream",
        id: "stream-1",
        phase: "streaming",
        response: "root = Ghost()",
        errors: [{ source: "parser", code: "unknown-component", message: "Transient error" }],
        parser: { statementCount: 1, orphaned: ["draft"] },
      }),
    );

    const expand = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Toggle OpenUI Lang stream details"]',
    );
    click(expand!);

    expect(container.textContent).not.toContain("Transient error");
    expect(container.textContent).toContain("root = Ghost()");
    expect(container.textContent).toContain("Orphaned: draft");
  });

  it("keeps an expanded stream open when a settled error snapshot is refreshed", () => {
    render({ enabled: true, errorsOnly: false });

    act(() =>
      observability.error({
        kind: "react-lang:stream",
        id: "stream-1",
        phase: "settled",
        response: "root = First()",
        errors: [{ source: "parser", code: "first-error", message: "First error" }],
      }),
    );

    const expand = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Toggle OpenUI Lang stream details"]',
    );
    click(expand!);
    expect(container.textContent).toContain("First error");

    act(() =>
      observability.error({
        kind: "react-lang:stream",
        id: "stream-1",
        phase: "settled",
        response: "root = Second()",
        errors: [{ source: "query", code: "query-error", message: "Second error" }],
      }),
    );

    expect(container.textContent?.match(/OpenUI Lang stream/g)).toHaveLength(1);
    expect(container.textContent).not.toContain("First error");
    expect(container.textContent).toContain("Second error");
    expect(container.textContent).toContain("root = Second()");
  });

  it("renders only one widget when multiple instances are mounted", () => {
    const second = document.createElement("div");
    document.body.appendChild(second);
    const secondRoot = createRoot(second);

    render({ enabled: true });
    act(() => secondRoot.render(createElement(OpenUIDevtools, { enabled: true })));

    expect(document.querySelectorAll('button[aria-label="Open OpenUI devtools"]')).toHaveLength(1);

    act(() => secondRoot.unmount());
    second.remove();
  });

  it("lets a manual instance win over an auto-mounted one", () => {
    // Auto-mounted instance first (as react-lang's bootstrap would do) …
    render({ enabled: true, __autoMounted: true });
    expect(container.querySelector('button[aria-label="Open OpenUI devtools"]')).not.toBeNull();

    // … then a manual instance mounts and takes over.
    const manual = document.createElement("div");
    document.body.appendChild(manual);
    const manualRoot = createRoot(manual);
    act(() => manualRoot.render(createElement(OpenUIDevtools, { enabled: true })));

    expect(container.querySelector('button[aria-label="Open OpenUI devtools"]')).toBeNull();
    expect(manual.querySelector('button[aria-label="Open OpenUI devtools"]')).not.toBeNull();

    // When the manual instance unmounts, the auto instance takes back over.
    act(() => manualRoot.unmount());
    manual.remove();
    expect(container.querySelector('button[aria-label="Open OpenUI devtools"]')).not.toBeNull();
  });

  it("removes a resolved stream from the errors-only view", () => {
    render({ enabled: true, errorsOnly: true, autoOpenOnError: false });

    act(() =>
      observability.error({
        kind: "react-lang:stream",
        id: "stream-1",
        phase: "settled",
        errors: [{ source: "query", code: "query-error", message: "Query failed" }],
      }),
    );
    expect(container.textContent).toContain("OpenUI Lang stream");

    act(() =>
      observability.info({
        kind: "react-lang:stream",
        id: "stream-1",
        phase: "settled",
        errors: [],
      }),
    );

    expect(container.textContent).not.toContain("OpenUI Lang stream");
    expect(container.textContent).toContain("No events captured yet.");
  });

  it("disables OpenUI Paste until a library is registered", () => {
    render({ enabled: true });
    expect(openPasteButton()?.disabled).toBe(true);
  });

  it("opens OpenUI Paste from a late-mounted registry entry", () => {
    seedLibrary();
    render({ enabled: true });
    const paste = openPasteButton();
    expect(paste?.disabled).toBe(false);
    click(paste!);
    expect(container.querySelector('[aria-label="OpenUI Paste"]')).not.toBeNull();
    expect(container.querySelector('textarea[aria-label="OpenUI Lang"]')).not.toBeNull();
  });

  it("shows paste panels and stream controls", () => {
    seedLibrary();
    render({ enabled: true });
    click(openPasteButton()!);
    expect(container.querySelector('[aria-label="Playback controls"]')).not.toBeNull();
    expect(container.querySelector('button[aria-label="Stream"]')).not.toBeNull();
    const tabs = container.querySelector('[role="tablist"]')?.textContent ?? "";
    expect(tabs).toContain("Render");
    expect(tabs).toContain("Validation");
    expect(tabs).toContain("Tree");
    expect(tabs).toContain("JSON");
    expect(tabs).toContain("Stream");
  });

  it("shows the installed lang-core version in OpenUI Paste", async () => {
    seedLibrary();
    render({ enabled: true });
    click(openPasteButton()!);
    await act(async () => {
      await Promise.resolve();
    });
    expect(container.textContent).toContain("lang-core 9.9.9");
  });

  it("switches to the validation panel", async () => {
    seedLibrary();
    render({ enabled: true });
    click(openPasteButton()!);
    await act(async () => {
      await Promise.resolve();
    });
    const validation = [...container.querySelectorAll('[role="tab"]')].find((tab) =>
      tab.textContent?.startsWith("Validation"),
    );
    click(validation!);
    expect(container.textContent).toContain("Paste some OpenUI Lang to validate it.");
  });

  it("does not list library registration pings as events", () => {
    render({ enabled: true, errorsOnly: false });
    act(() =>
      observability.info({
        kind: "react-lang:library",
        root: "Card",
        components: ["Card"],
        message: "Library registered (root: Card)",
      }),
    );
    click(toggle());
    expect(container.textContent).not.toContain("Library registered");
    expect(container.textContent).toContain("No events captured yet.");
  });

  it("ejects OpenUI Paste into a separate window", () => {
    seedLibrary();
    const popupDoc = document.implementation.createHTMLDocument("paste");
    const popup = {
      document: popupDoc,
      focus: vi.fn(),
      close: vi.fn(),
      closed: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    const open = vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);

    render({ enabled: true });
    click(openPasteButton()!);
    click(container.querySelector('button[aria-label="Open OpenUI Paste in a new window"]')!);

    expect(open).toHaveBeenCalled();
    expect(container.querySelector('[aria-label="OpenUI Paste"]')).toBeNull();
    expect(popupDoc.getElementById("openui-paste-root")).not.toBeNull();
    expect(popupDoc.body.textContent).toContain("OpenUI Paste");
    open.mockRestore();
  });

  it("focuses the ejected window when OpenUI Paste is clicked again", () => {
    seedLibrary();
    const popupDoc = document.implementation.createHTMLDocument("paste");
    const popup = {
      document: popupDoc,
      focus: vi.fn(),
      close: vi.fn(),
      closed: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    const open = vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);

    render({ enabled: true });
    click(openPasteButton()!);
    click(container.querySelector('button[aria-label="Open OpenUI Paste in a new window"]')!);
    popup.focus.mockClear();

    click(openPasteButton()!);

    expect(popup.focus).toHaveBeenCalled();
    expect(container.querySelector('[aria-label="OpenUI Paste"]')).toBeNull();
    open.mockRestore();
  });

  it("stays in the drawer when the popup is blocked", () => {
    seedLibrary();
    const open = vi.spyOn(window, "open").mockReturnValue(null);

    render({ enabled: true });
    click(openPasteButton()!);
    click(container.querySelector('button[aria-label="Open OpenUI Paste in a new window"]')!);

    expect(container.querySelector('[aria-label="OpenUI Paste"]')).not.toBeNull();
    expect(container.textContent).toContain("Allow popups for this origin");
    open.mockRestore();
  });
});
