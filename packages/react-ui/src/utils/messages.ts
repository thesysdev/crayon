import {
  lookupArtifactRenderer,
  useArtifactRendererRegistry,
  type Message,
  type ToolActivity,
} from "@openuidev/react-headless";

type ArtifactRendererRegistry = ReturnType<typeof useArtifactRendererRegistry>;

/** Id of the "live" assistant message in a thread, or null. Shared by the
 *  thread and the assistant component to decide which message is streaming. */
export function getLastAssistantMessageId(messages: Message[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const role = messages[i]?.role;
    if (role === "assistant") return messages[i]!.id;
    if (role === "user") return null;
  }
  return null;
}

/** Activities whose tool has a matched artifact/search renderer — the ones that
 *  render a rich preview outside the raw timeline. */
export function getMatchedRendererActivities(
  registry: ArtifactRendererRegistry,
  activities: ToolActivity[],
): ToolActivity[] {
  return activities.filter((a) => !!(registry && lookupArtifactRenderer(registry, a.toolName)));
}
