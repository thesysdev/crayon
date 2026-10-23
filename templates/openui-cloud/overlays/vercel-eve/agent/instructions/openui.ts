import { generateSystemPrompt } from "@openuidev/lang-core";
import { defineDynamic, defineInstructions } from "eve/instructions";
import librarySpec from "../../src/generated/spec.json" with { type: "json" };

// The generated spec carries the library and its prompt options; generateSystemPrompt takes them separately.
const { promptOptions, ...library } = librarySpec;

/**
 * Teach the agent to answer in OpenUI Lang. Resolved once per session so the
 * Cloud system prompt is only attached when a conversation starts.
 */
export default defineDynamic({
  events: {
    "session.started": () =>
      defineInstructions({
        markdown: generateSystemPrompt({ cloud: true, library, promptOptions }),
      }),
  },
});
