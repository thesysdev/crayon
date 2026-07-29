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
    act(() => observability.error({ kind: "real-error" }));

    expect(container.textContent).not.toContain("just-info");
    expect(container.textContent).toContain("real-error");
  });

  it("drills into the stack trace when a row's Stack Trace is clicked", () => {
    render({ enabled: true, errorsOnly: false });
    act(() => observability.error({ kind: "boom", error: toErrorInfo(new Error("kaboom")) }));

    const stackButton = buttonByText("Stack Trace");
    expect(stackButton).toBeDefined();
    click(stackButton!);

    expect(container.textContent).toContain("stack trace");
  });
});
