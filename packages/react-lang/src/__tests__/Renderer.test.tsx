import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";
import { createLibrary, defineComponent } from "../library";
import { Renderer } from "../Renderer";

// Dummy renderer — never actually renders DOM, used for parser/callback tests
const DummyComponent = (() => null) as any;

const TextContent = defineComponent({
  name: "TextContent",
  props: z.object({ text: z.string() }),
  description: "Displays text content",
  component: DummyComponent,
});

const library = createLibrary({
  components: [TextContent],
  root: "TextContent",
});

// openui-lang uses assignment syntax: `identifier = Component(args)`
const VALID_RESPONSE = 'root = TextContent("Hello world")';

// ─── Renderer ───────────────────────────────────────────────────────────────

describe("Renderer", () => {
  it("renders without errors when response is null", () => {
    const { container } = render(<Renderer response={null} library={library} />);

    expect(container).toBeDefined();
  });

  it("renders without errors when response is empty string", () => {
    const { container } = render(<Renderer response="" library={library} />);

    expect(container).toBeDefined();
  });

  it("calls onParseResult with null when response is null", () => {
    const onParseResult = vi.fn();

    render(<Renderer response={null} library={library} onParseResult={onParseResult} />);

    expect(onParseResult).toHaveBeenCalledWith(null);
  });

  it("calls onParseResult with a ParseResult when given valid openui-lang", async () => {
    const onParseResult = vi.fn();

    render(<Renderer response={VALID_RESPONSE} library={library} onParseResult={onParseResult} />);

    expect(onParseResult).toHaveBeenCalled();
    const result = onParseResult.mock.calls[onParseResult.mock.calls.length - 1]![0];
    expect(result).not.toBeNull();
    expect(result.root).toBeDefined();
    expect(result.root).not.toBeNull();
  });

  it("parse result contains the correct component typeName", async () => {
    const onParseResult = vi.fn();

    render(<Renderer response={VALID_RESPONSE} library={library} onParseResult={onParseResult} />);

    const result = onParseResult.mock.calls[onParseResult.mock.calls.length - 1]![0];
    expect(result?.root?.typeName).toBe("TextContent");
  });

  it("defaults isStreaming to false", () => {
    // Should not throw when isStreaming is omitted
    const { container } = render(<Renderer response={null} library={library} />);
    expect(container).toBeDefined();
  });

  it("accepts isStreaming prop without errors", () => {
    const { container } = render(<Renderer response={null} library={library} isStreaming={true} />);
    expect(container).toBeDefined();
  });
});
