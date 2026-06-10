import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { Renderer } from "../Renderer";
import { createLibrary, defineComponent } from "../library";

// A component that emits a non-div host element so wrapper <div>s can be
// asserted independently of the rendered content.
const Text = defineComponent({
  name: "Text",
  description: "Displays text",
  props: z.object({ value: z.string() }),
  component: ({ props }) => <span>{props.value as string}</span>,
});

const library = createLibrary({ components: [Text], root: "Text" });
const RESPONSE = 'root = Text("hello world")';

// A stand-in for React Native's `View`: a host wrapper passed as a component
// reference rather than a string tag. Uses createElement with a custom tag so
// the emitted element is trivially distinguishable from a web <div>.
function NativeView({ children }: { children?: React.ReactNode; style?: unknown }) {
  return React.createElement("rn-view", null, children);
}

describe("Renderer host wrappers", () => {
  it("defaults to div wrappers on the web", () => {
    const html = renderToStaticMarkup(<Renderer response={RESPONSE} library={library} />);
    expect(html).toContain("<div");
    // Web content wrapper keeps the CSS fade transition.
    expect(html).toContain("transition");
    expect(html).toContain("hello world");
  });

  it("uses custom container/content components instead of div (React Native)", () => {
    const html = renderToStaticMarkup(
      <Renderer
        response={RESPONSE}
        library={library}
        containerComponent={NativeView}
        contentComponent={NativeView}
      />,
    );
    // The crash-prone web host is gone; native wrappers are mounted instead.
    expect(html).not.toContain("<div");
    expect(html).toContain("<rn-view");
    expect(html).toContain("hello world");
  });

  it("omits the web-only CSS transition when the content host is native", () => {
    const html = renderToStaticMarkup(
      <Renderer
        response={RESPONSE}
        library={library}
        containerComponent={NativeView}
        contentComponent={NativeView}
      />,
    );
    expect(html).not.toContain("transition");
  });

  it("renders nothing for a null response regardless of host", () => {
    expect(renderToStaticMarkup(<Renderer response={null} library={library} />)).toBe("");
    expect(
      renderToStaticMarkup(
        <Renderer response={null} library={library} containerComponent={NativeView} />,
      ),
    ).toBe("");
  });
});
