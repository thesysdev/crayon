import type { LibraryJSONSchema } from "@openuidev/lang-core";
import { describe, expect, it, vi } from "vitest";
import { A2UIActionError, createA2UILangClient } from "../client";
import {
  applyDataModelUpdate,
  dataModelToOpenUIState,
  mergeOpenUIStateIntoDataModel,
} from "../json-pointer";
import type { RendererToAgentMessage } from "../types";

const schema: LibraryJSONSchema = {
  $defs: {
    Stack: {
      properties: { children: {} },
      required: ["children"],
    },
    TextContent: {
      properties: { text: {}, variant: {} },
      required: ["text"],
    },
  },
};

function createSurface(client: ReturnType<typeof createA2UILangClient>) {
  return client.process({
    version: "v1.0",
    createSurface: {
      surfaceId: "main",
      catalogId: "com.example:openui",
      dataModel: { user: { name: "Alice" } },
    },
  });
}

describe("A2UILangClient", () => {
  it("runs the A2UI surface lifecycle with incremental OpenUI Lang updates", async () => {
    const client = createA2UILangClient({ schema });

    expect((await createSurface(client)).ok).toBe(true);
    expect(
      (
        await client.process({
          version: "v1.0",
          updateComponents: {
            surfaceId: "main",
            components: ["root = Stack([title])", 'title = TextContent("Hello")'],
          },
        })
      ).ok,
    ).toBe(true);

    let surface = client.getSurface("main");
    expect(surface?.parseResult?.root?.typeName).toBe("Stack");
    expect(surface?.parseResult?.root?.props.children).toEqual([
      expect.objectContaining({
        typeName: "TextContent",
        statementId: "title",
        props: { text: "Hello", variant: undefined },
      }),
    ]);

    await client.process({
      version: "v1.0",
      updateComponents: {
        surfaceId: "main",
        components: ['title = TextContent("Updated")'],
      },
    });
    expect(client.getSurface("main")?.source).toContain('title = TextContent("Updated")');
    expect(client.getSurface("main")?.source).not.toContain('TextContent("Hello")');

    await client.process({
      version: "v1.0",
      updateDataModel: { surfaceId: "main", path: "/user/name", value: "Bob" },
    });
    surface = client.getSurface("main");
    expect(surface?.dataModel).toEqual({ user: { name: "Bob" } });

    expect(
      (
        await client.process({
          version: "v1.0",
          deleteSurface: { surfaceId: "main" },
        })
      ).ok,
    ).toBe(true);
    expect(client.getSurface("main")).toBeUndefined();
  });

  it("rejects legacy components embedded in createSurface for the hybrid profile", async () => {
    const messages: RendererToAgentMessage[] = [];
    const client = createA2UILangClient({ schema, onMessage: (message) => messages.push(message) });

    const result = await client.process({
      version: "v1.0",
      createSurface: {
        surfaceId: "main",
        catalogId: "com.example:openui",
        components: [{ id: "root", component: "Text" }],
      },
    });

    expect(result.ok).toBe(false);
    expect(result.outbound).toEqual(messages);
    expect(messages[0]).toMatchObject({
      error: { code: "VALIDATION_FAILED", path: "/createSurface/components" },
    });
    expect(client.getSurface("main")).toBeUndefined();
  });

  it("emits A2UI actions, resolves actionResponse, and stores responsePath", async () => {
    const messages: RendererToAgentMessage[] = [];
    const client = createA2UILangClient({
      schema,
      onMessage: (message) => messages.push(message),
      now: () => new Date("2026-07-24T10:00:00.000Z"),
      createId: () => "action-1",
    });
    await createSurface(client);

    const response = client.dispatchAction({
      surfaceId: "main",
      sourceComponentId: "submitButton",
      name: "submit",
      context: { intent: "save" },
      wantResponse: true,
      responsePath: "/result",
    });

    expect(messages.at(-1)).toEqual({
      version: "v1.0",
      action: {
        name: "submit",
        surfaceId: "main",
        sourceComponentId: "submitButton",
        timestamp: "2026-07-24T10:00:00.000Z",
        context: { intent: "save" },
        wantResponse: true,
        actionId: "action-1",
      },
    });

    await client.process({
      version: "v1.0",
      actionId: "action-1",
      actionResponse: { value: { saved: true } },
    });
    await expect(response).resolves.toEqual({ saved: true });
    expect(client.getSurface("main")?.dataModel.result).toEqual({ saved: true });
  });

  it("rejects a pending action when actionResponse contains an error", async () => {
    const client = createA2UILangClient({ schema, createId: () => "action-2" });
    await createSurface(client);
    const response = client.dispatchAction({
      surfaceId: "main",
      sourceComponentId: "button",
      name: "submit",
      wantResponse: true,
    });

    await client.process({
      version: "v1.0",
      actionId: "action-2",
      actionResponse: { error: { code: "REJECTED", message: "Nope" } },
    });

    await expect(response).rejects.toEqual(
      expect.objectContaining<A2UIActionError>({ code: "REJECTED", message: "Nope" }),
    );
  });

  it("executes callFunction and returns the official functionResponse shape", async () => {
    const lookup = vi.fn(async ({ id }: { id?: unknown }) => ({ id: String(id), found: true }));
    const client = createA2UILangClient({
      schema,
      functions: { lookup: lookup as never },
    });

    const result = await client.process({
      version: "v1.0",
      functionCallId: "function-1",
      wantResponse: true,
      callFunction: { call: "lookup", args: { id: 42 } },
    });

    expect(lookup).toHaveBeenCalledWith({ id: 42 });
    expect(result).toEqual({
      ok: true,
      outbound: [
        {
          version: "v1.0",
          functionResponse: {
            functionCallId: "function-1",
            call: "lookup",
            value: { id: "42", found: true },
          },
        },
      ],
    });
  });

  it("maps OpenUI action context, form state, and source statement to A2UI", async () => {
    const messages: RendererToAgentMessage[] = [];
    const client = createA2UILangClient({ schema, onMessage: (message) => messages.push(message) });
    await createSurface(client);

    client.dispatchOpenUIAction("main", {
      type: "submit",
      params: { mode: "fast" },
      humanFriendlyMessage: "Submit",
      formState: { contact: { email: { value: "a@example.com", componentType: "Input" } } },
      formName: "contact",
      sourceComponentId: "submitButton",
    });

    expect(messages.at(-1)).toMatchObject({
      action: {
        name: "submit",
        sourceComponentId: "submitButton",
        context: {
          mode: "fast",
          formState: { contact: { email: "a@example.com" } },
        },
      },
    });
  });

  it("keeps renderer data-model metadata in sync with local OpenUI state", async () => {
    const client = createA2UILangClient({ schema });
    await createSurface(client);

    expect(
      client.updateSurfaceFromOpenUIState("main", {
        $user: { name: "Carol" },
        contact: { email: { value: "c@example.com", componentType: "Input" } },
      }),
    ).toBe(true);
    expect(client.getRendererDataModel()).toEqual({
      version: "v1.0",
      surfaces: {
        main: {
          user: { name: "Carol" },
          contact: { email: "c@example.com" },
        },
      },
    });
  });
});

describe("A2UI data model bridge", () => {
  it("supports RFC 6901 escaping, arrays, deletion, and root replacement", () => {
    let model = applyDataModelUpdate({}, "/a~1b/~0key", ["first", "second"]);
    expect(model).toEqual({ "a/b": { "~key": ["first", "second"] } });

    model = applyDataModelUpdate(model, "/a~1b/~0key/0", null);
    expect(model).toEqual({ "a/b": { "~key": ["second"] } });

    model = applyDataModelUpdate(model, "/", { replaced: true });
    expect(model).toEqual({ replaced: true });
  });

  it("converts A2UI data-model keys to Lang bindings and unwraps form state", () => {
    expect(dataModelToOpenUIState({ user: { name: "Alice" } })).toEqual({
      $user: { name: "Alice" },
      user: { name: "Alice" },
    });
    expect(
      mergeOpenUIStateIntoDataModel(
        { untouched: true },
        { form: { field: { value: "hello", componentType: "Input" } } },
      ),
    ).toEqual({ untouched: true, form: { field: "hello" } });
  });

  it("selects whichever binding or form copy changed from the current model", () => {
    expect(
      mergeOpenUIStateIntoDataModel(
        { contact: { email: "old@example.com" } },
        {
          $contact: { email: "old@example.com" },
          contact: { email: { value: "form@example.com", componentType: "Input" } },
        },
      ),
    ).toEqual({ contact: { email: "form@example.com" } });

    expect(
      mergeOpenUIStateIntoDataModel({ filter: "all" }, { $filter: "active", filter: "all" }),
    ).toEqual({ filter: "active" });
  });
});
