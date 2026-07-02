// Writes the OpenUI system prompt to src/generated/system-prompt.txt so the
// /api/chat route can prepend it server-side. Runs automatically before
// `dev` and `build`; re-run by hand after customizing the component library:
//
//   npm run generate:prompt
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { openuiLibrary, openuiPromptOptions } from "@openuidev/react-ui/genui-lib";

const outFile = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../src/generated/system-prompt.txt",
);

const prompt = openuiLibrary.prompt(openuiPromptOptions);
await mkdir(dirname(outFile), { recursive: true });
await writeFile(outFile, prompt, "utf8");
console.log(`Wrote ${prompt.length} chars to ${outFile}`);
