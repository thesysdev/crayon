# `@openuidev/a2ui-lang`

An experimental A2UI v1.0 profile that keeps the protocol lifecycle and envelopes intact while representing component lists as OpenUI Lang statements.

```json
{
  "version": "v1.0",
  "updateComponents": {
    "surfaceId": "main",
    "components": ["root = Stack([title])", "title = TextContent(\"Hello\")"]
  }
}
```

`updateDataModel`, `deleteSurface`, actions, `callFunction`, `functionResponse`, `actionResponse`, errors, capabilities, and renderer data-model metadata retain their A2UI v1.0 shapes. For v1.0 single-message creation, optional `createSurface.components` uses the same Lang statement array as `updateComponents.components`, so there is exactly one component representation on the wire.

Publishable schemas are available under `@openuidev/a2ui-lang/schema/*` for agent-to-renderer messages, renderer-to-agent messages, renderer/agent capabilities, and renderer data-model metadata.

## How updates work

Each array item is one complete OpenUI Lang statement (a multiline statement block is also accepted). Repeated messages are merged by statement ID using `@openuidev/lang-core`. A newer assignment replaces the previous statement, and `statementId = null` deletes it. The `root` statement remains the surface root.

## Usage

```tsx
import { createA2UILangClient } from "@openuidev/a2ui-lang";
import { A2UILangRenderer } from "@openuidev/a2ui-lang/react";
import { openuiLibrary } from "@openuidev/react-ui";

const client = createA2UILangClient({
  schema: openuiLibrary.toJSONSchema(),
  rootName: openuiLibrary.root,
  rendererCapabilities: {
    "v1.0": { supportedCatalogIds: ["com.example:openui"] },
  },
  onMessage(message, metadata) {
    transport.send(message, metadata);
  },
});

await client.process({
  version: "v1.0",
  createSurface: {
    surfaceId: "main",
    catalogId: "com.example:openui",
    dataModel: { user: { name: "Alice" } },
  },
});

await client.process({
  version: "v1.0",
  updateComponents: {
    surfaceId: "main",
    components: ["root = Stack([greeting])", 'greeting = TextContent("Hello, " + $user.name)'],
  },
});

export function Surface() {
  return (
    <A2UILangRenderer
      client={client}
      surfaceId="main"
      library={openuiLibrary}
      isStreaming={transport.isStreaming}
      mapAction={(event) => ({ name: event.type })}
    />
  );
}
```

The client is framework-neutral: it owns surface lifecycle, runtime envelope validation, Lang parsing and merging, data-model patches, actions, RPC, and protocol errors. `A2UILangRenderer` is the React adapter; it subscribes to one surface and delegates the parsed OpenUI Lang UI to `@openuidev/react-lang`.

When `sendDataModel` is enabled, the second `onMessage` argument contains `a2uiRendererDataModel` metadata filtered to opted-in surfaces. Configured renderer capabilities are exposed in the same metadata object. The host transport decides where to attach this metadata.

Renderer functions can be registered as a direct function shorthand or as `{ handler, callableFrom }`. Explicit registrations default to `rendererOnly`; incoming `callFunction` messages are accepted only for `agentOnly` and `rendererOrAgent` registrations.

For A2UI action compatibility, assign interactive controls to named Lang statements. Their statement names become `sourceComponentId`; inline interactive components fall back to the surface `root` ID.

See the [reproducible A2UI comparison](../../benchmarks/A2UI_BENCHMARK.md) for methodology, fixtures, and results.
