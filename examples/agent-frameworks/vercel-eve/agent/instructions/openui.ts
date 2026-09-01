import { generateSystemPrompt } from "@openuidev/thesys-server";
import { defineDynamic, defineInstructions } from "eve/instructions";

/**
 * Teach the agent to answer in OpenUI Lang. Resolved once per session so the
 * Cloud system prompt is only attached when a conversation starts.
 */
export default defineDynamic({
  events: {
    "session.started": () =>
      defineInstructions({
        markdown: generateSystemPrompt(),
      }),
  },
});
