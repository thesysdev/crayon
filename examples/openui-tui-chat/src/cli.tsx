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

// Use the terminal's alternate screen buffer: a stable, full-screen canvas that
// doesn't scroll the main buffer, so full-height repaints don't flicker/jump and
// mouse clicks map 1:1 to screen rows. (Trade-off: no scrollback history.)
const ENTER_ALT_SCREEN = "\u001B[?1049h";
const EXIT_ALT_SCREEN = "\u001B[?1049l";
process.stdout.write(ENTER_ALT_SCREEN);
const restoreScreen = () => {
  try {
    process.stdout.write(EXIT_ALT_SCREEN);
  } catch {
    // ignore
  }
};
process.on("exit", restoreScreen);

const app = render(createElement(App, { processMessage: makeProcessMessage(systemPrompt) }));
app.waitUntilExit().then(restoreScreen, restoreScreen);
