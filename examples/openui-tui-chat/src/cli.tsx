// Polyfill requestAnimationFrame for react-headless's streaming updates (it
// debounces message updates via rAF, which bare Node does not provide).
const g = globalThis as unknown as {
  requestAnimationFrame?: (cb: (t: number) => void) => unknown;
  cancelAnimationFrame?: (id: unknown) => void;
};
if (typeof g.requestAnimationFrame !== "function") {
  g.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
  g.cancelAnimationFrame = (id) => clearTimeout(id as ReturnType<typeof setTimeout>);
}

import { ChatProvider, openAIMessageFormat, openAIReadableStreamAdapter } from "@openuidev/react-headless";
import { render } from "ink";
import { createElement } from "react";
import { App } from "./app.js";
import { tuiLibrary } from "./genui/library.js";
import { makeProcessMessage } from "./llm.js";

if (!process.env.OPENAI_API_KEY) {
  console.error(
    "\nOPENAI_API_KEY is not set. Export it (optionally OPENAI_BASE_URL / OPENAI_MODEL) and retry.\n",
  );
  process.exit(1);
}

const systemPrompt = tuiLibrary.prompt();

render(
  createElement(ChatProvider, {
    processMessage: makeProcessMessage(systemPrompt),
    streamProtocol: openAIReadableStreamAdapter(),
    messageFormat: openAIMessageFormat,
    children: createElement(App),
  }),
);
