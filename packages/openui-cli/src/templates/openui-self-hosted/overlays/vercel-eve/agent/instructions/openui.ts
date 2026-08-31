import { generateSystemPrompt } from "@openuidev/lang-core";
import { defineDynamic, defineInstructions } from "eve/instructions";
import librarySpec from "../../src/generated/spec.json";
import { promptOptions } from "../../src/lib/prompt-options";

/**
 * Teach the agent to answer in OpenUI Lang. Resolved once per session so the
 * component-library prompt is only attached when a conversation starts.
 */
export default defineDynamic({
  events: {
    "session.started": () =>
      defineInstructions({
        markdown: generateSystemPrompt({ library: librarySpec, promptOptions }),
      }),
  },
});
