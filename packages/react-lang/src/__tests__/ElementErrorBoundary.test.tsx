import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ElementErrorBoundary } from "../Renderer";

// Throws when `explode` is set, otherwise renders a marker we can assert on.
function Child({ explode, label }: { explode: boolean; label: string }) {
  if (explode) throw new Error("boom");
  return <span>{label}</span>;
}

describe("ElementErrorBoundary", () => {
  let container: HTMLDivElement;
  let root: Root;
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    // React logs boundary-caught render errors to console.error; silence them.
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    consoleError.mockRestore();
  });

  const render = (node: ReactNode) => act(() => root.render(node));

  it("renders nothing on error instead of re-presenting stale children, then recovers", () => {
    const onError = vi.fn();
    const wrap = (explode: boolean, label: string) => (
      <ElementErrorBoundary componentName="Child" onError={onError}>
        <Child explode={explode} label={label} />
      </ElementErrorBoundary>
    );

    render(wrap(false, "good"));
    expect(container.textContent).toBe("good");

    // Child throws: the boundary must render nothing, not re-present the stale
    // "good" subtree (whose DOM React has already moved) — that desync is what
    // crashes the host app with a commit-phase insertBefore error (#727).
    render(wrap(true, "good"));
    expect(container.textContent).toBe("");
    // (React may retry the throwing render, so onError can fire more than once.)
    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0]?.[0]).toMatchObject({
      code: "render-error",
      component: "Child",
    });

    // New valid children arrive: the boundary auto-recovers.
    render(wrap(false, "recovered"));
    expect(container.textContent).toBe("recovered");
  });
});
