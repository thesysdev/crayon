import type { KitDefinition } from "./kit";

export type ToolCall = { tool: string; args: unknown; ms: number; ok: boolean };

/**
 * A Renderer `toolProvider` for a kit: every `Query()` in a kit dashboard POSTs
 * its arguments to `${endpoint}/${kit.id}/${tool}` and resolves with the JSON
 * result. Pair it with a route that calls `runTool` from the server entry.
 */
export function createToolProvider(
  kit: KitDefinition,
  options: { endpoint?: string; onCall?: (call: ToolCall) => void } = {},
) {
  const endpoint = options.endpoint ?? "/api/tools";
  return Object.fromEntries(
    kit.tools.map((tool) => [
      tool.name,
      async (args: Record<string, unknown>) => {
        const started = performance.now();
        const response = await fetch(`${endpoint}/${kit.id}/${tool.name}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(args ?? {}),
        });
        const body = await response.json();
        options.onCall?.({
          tool: tool.name,
          args,
          ms: Math.round(performance.now() - started),
          ok: response.ok,
        });
        if (!response.ok) throw new Error(body.error ?? `${tool.name} failed`);
        return body;
      },
    ]),
  );
}
