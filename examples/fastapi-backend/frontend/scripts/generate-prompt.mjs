// Writes the OpenUI system prompt to backend/app/system_prompt.txt so the
// FastAPI backend can prepend it server-side. Re-run after upgrading
// @openuidev/react-ui:
//
//   npm run generate:prompt
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { openuiLibrary, openuiPromptOptions } from "@openuidev/react-ui/genui-lib";

const outFile = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../backend/app/system_prompt.txt",
);

const prompt = openuiLibrary.prompt(openuiPromptOptions);
await mkdir(dirname(outFile), { recursive: true });
await writeFile(outFile, prompt, "utf8");
console.log(`Wrote ${prompt.length} chars to ${outFile}`);
