import { describe, expect, it } from "vitest";
import { buildMessage, parseMessage } from "../message";

describe("message protocol", () => {
  it("round trips content, context, attributes, and end", () => {
    const input = {
      content: 'root = Card([title])\ntitle = TextContent("a ]]>openui:end")',
      context: [{ note: "rush" }],
      attributes: { library: "@acme/support@1.2.0", note: "a b!" },
      end: true,
    };
    const raw = buildMessage(input);
    expect(raw.split("\n")[0]).toBe(
      "]]>openui:content?" + new URLSearchParams(input.attributes).toString(),
    );
    expect(parseMessage(raw)).toEqual(input);
    expect(parseMessage(`${raw}\n`).content).toBe(input.content);
  });

  it("keeps plain text byte for byte", () => {
    const plain = "Hi\r\n```openui-lang\nroot = A()\n```\n";
    expect(parseMessage(plain)).toMatchObject({ content: plain, context: null, end: false });
  });

  it("uses the last content and keeps non-JSON context as text", () => {
    const raw =
      ']]>openui:content\nold\n]]>openui:context\n{}\n]]>openui:content?thesys=true\nnew\r\n]]>openui:context\n{"a":';
    expect(parseMessage(raw)).toEqual({
      content: "new",
      context: '{"a":',
      attributes: { thesys: "true" },
      end: false,
    });
  });

  it("holds back a marker line cut mid-stream", () => {
    const raw = "]]>openui:content\nroot = A()\n]]>open";
    expect(parseMessage(raw, { streaming: true }).content).toBe("root = A()");
    expect(parseMessage(raw).content).toBe("root = A()\n]]>open");
  });

  it("reads the sanitizer retry when its content line follows the failed attempt mid-line", () => {
    const header = "]]>openui:content?thesys=true";
    const raw = `${header}\nroot = A("Broken${header}\nroot = B()\n]]>openui:end`;
    expect(parseMessage(raw)).toMatchObject({
      content: "root = B()",
      attributes: { thesys: "true" },
      end: true,
    });
  });

  it("holds back a retry content line cut mid-stream", () => {
    const raw = ']]>openui:content\nroot = A("Broken]]>openui:content?thesys=true\nroot = B()';
    const header = raw.indexOf("]]>", 3);
    // Chunks end inside the retry line: `]]>`, `]]>openui:cont`, then the whole line.
    for (const end of [header + 3, header + 14, raw.indexOf("\nroot = B")]) {
      expect(parseMessage(raw.slice(0, end), { streaming: true }).content).toBe('root = A("Broken');
    }
    expect(parseMessage(raw, { streaming: true })).toMatchObject({
      content: "root = B()",
      attributes: { thesys: "true" },
    });
  });

  it("ignores an end line before the winning content", () => {
    const raw = `]]>openui:context\n{"$x":1}\n]]>openui:end\n]]>openui:content\nroot = A()`;
    expect(parseMessage(raw)).toMatchObject({ content: "root = A()", context: null, end: false });
  });
});
