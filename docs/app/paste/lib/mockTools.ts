/**
 * Mock tool provider for the render window: any Query()/Mutation() tool name
 * resolves after a short delay with canned data, so interactive snippets
 * render instead of erroring on unregistered tools.
 */
const CANNED_RESULT = {
  status: "ok",
  note: "Mock response from the paste playground — tools are not connected.",
  items: [
    { id: 1, label: "Alpha", value: 42 },
    { id: 2, label: "Beta", value: 17 },
    { id: 3, label: "Gamma", value: 8 },
  ],
};

// react-lang treats anything with a callTool() method as an MCP client, and
// the runtime may probe `then` (thenable checks) — the catch-all must not
// answer to those, or the provider is misdetected.
const RESERVED = new Set(["callTool", "then", "toJSON", "constructor"]);

export const mockToolProvider = new Proxy(
  {} as Record<string, (args: Record<string, unknown>) => Promise<unknown>>,
  {
    get: (_target, prop) => {
      if (typeof prop !== "string" || RESERVED.has(prop)) return undefined;
      return async (args: Record<string, unknown>) => {
        await new Promise((r) => setTimeout(r, 400));
        return { ...CANNED_RESULT, tool: prop, receivedArgs: args };
      };
    },
    has: (_target, prop) => typeof prop === "string" && !RESERVED.has(prop),
  },
);
