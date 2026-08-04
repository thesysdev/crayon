// @vitest-environment jsdom
import { observability, toErrorInfo } from "@openuidev/observability";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { OpenUIDevtools, type OpenUIDevtoolsProps } from "./index";

// React's act() requires this flag to flush effects/state synchronously in tests.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
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
    expect(container.textContent).toContain("info");
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
});
