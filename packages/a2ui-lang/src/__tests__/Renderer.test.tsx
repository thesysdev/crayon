import { createLibrary, defineComponent } from "@openuidev/react-lang";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { createA2UILangClient } from "../client";
import { A2UILangRenderer } from "../Renderer";

const TextContent = defineComponent({
  name: "TextContent",
  description: "Text",
  props: z.object({ text: z.string() }),
  component: ({ props, statementId }) => <span data-statement={statementId}>{props.text}</span>,
});

const Stack = defineComponent({
  name: "Stack",
  description: "Stack",
  props: z.object({ children: z.array(TextContent.ref) }),
  component: ({ props, renderNode }) => <div>{renderNode(props.children)}</div>,
});

const library = createLibrary({ components: [Stack, TextContent], root: "Stack" });

describe("A2UILangRenderer", () => {
  it("renders the active A2UI surface through the OpenUI Lang React renderer", async () => {
    const client = createA2UILangClient({
      schema: library.toJSONSchema(),
      rootName: library.root,
    });
    await client.process({
      version: "v1.0",
      createSurface: { surfaceId: "main", catalogId: "com.example:test" },
    });
    await client.process({
      version: "v1.0",
      updateComponents: {
        surfaceId: "main",
        components: ["root = Stack([greeting])", 'greeting = TextContent("Hello A2UI")'],
      },
    });

    const html = renderToStaticMarkup(
      <A2UILangRenderer client={client} surfaceId="main" library={library} />,
    );
    expect(html).toContain("Hello A2UI");
    expect(html).toContain('data-statement="greeting"');
  });

  it("renders nothing after the surface is deleted", async () => {
    const client = createA2UILangClient({ schema: library.toJSONSchema() });
    await client.process({
      version: "v1.0",
      createSurface: { surfaceId: "main", catalogId: "com.example:test" },
    });
    await client.process({
      version: "v1.0",
      deleteSurface: { surfaceId: "main" },
    });

    expect(
      renderToStaticMarkup(<A2UILangRenderer client={client} surfaceId="main" library={library} />),
    ).toBe("");
  });
});
