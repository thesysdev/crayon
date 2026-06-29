import { openuiChatLibrary, openuiChatPromptOptions } from "@openuidev/react-ui/genui-lib";
import { defineDynamic, defineInstructions } from "eve/instructions";

/**
 * Teach the agent to answer in OpenUI Lang. Resolved once per session so the
 * (large) component-library prompt is only attached when a conversation starts.
 */
export default defineDynamic({
  events: {
    "session.started": () =>
      defineInstructions({
        markdown: openuiChatLibrary.prompt(openuiChatPromptOptions),
      }),
  },
});
