import { generateSystemPrompt, type ChatLibrary } from "@openuidev/thesys-server";
import { readFileSync } from "fs";
import { join } from "path";

/** Load the generated library spec and wrap it in Cloud's managed prompt block. */
export function cloudInstructions(extra?: string): string {
  const spec = JSON.parse(
    readFileSync(join(process.cwd(), "src/generated/system-prompt.spec.json"), "utf-8"),
  ) as ChatLibrary & { components?: unknown };
  const { components: _components, ...library } = spec;
  return generateSystemPrompt({
    library,
    ...(extra ? { instructions: extra } : {}),
  });
}
