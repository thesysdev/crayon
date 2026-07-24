import type { AgentToRendererMessage } from "@openuidev/a2ui-lang";
import { createA2UILangClient } from "@openuidev/a2ui-lang";
import { readFileSync } from "fs";
import assert from "node:assert/strict";
import { join } from "path";
import { splitOpenUIStatements } from "./a2ui-converter.js";
import { A2UI_SCENARIOS } from "./generate-a2ui-samples.js";

function readJsonl(file: string): unknown[] {
  return readFileSync(file, "utf-8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
}

async function main(): Promise<void> {
  const schema = JSON.parse(readFileSync("schema.json", "utf-8"));

  assert.deepEqual(splitOpenUIStatements('root = Card("line 1\\nline 2")\nnext = Text("ok")'), [
    'root = Card("line 1\\nline 2")',
    'next = Text("ok")',
  ]);

  for (const scenario of A2UI_SCENARIOS) {
    const jsonMessages = readJsonl(join("samples", `${scenario}.a2ui.jsonl`)) as [
      Record<string, unknown>,
      Record<string, any>,
    ];
    const langMessages = readJsonl(join("samples", `${scenario}.a2ui-openui.jsonl`)) as [
      Record<string, unknown>,
      Record<string, any>,
    ];

    assert.equal(jsonMessages.length, 2);
    assert.equal(langMessages.length, 2);
    assert.deepEqual(jsonMessages[0], langMessages[0]);
    assert.deepEqual(
      {
        ...jsonMessages[1],
        updateComponents: { ...jsonMessages[1].updateComponents, components: [] },
      },
      {
        ...langMessages[1],
        updateComponents: { ...langMessages[1].updateComponents, components: [] },
      },
    );
    assert.ok(
      jsonMessages[1].updateComponents.components.every(
        (component: unknown) => typeof component === "object" && component !== null,
      ),
    );
    assert.ok(
      langMessages[1].updateComponents.components.every(
        (component: unknown) => typeof component === "string",
      ),
    );

    const client = createA2UILangClient({ schema });
    for (const message of langMessages) {
      const result = await client.process(message as AgentToRendererMessage);
      assert.equal(result.ok, true, `${scenario} failed hybrid protocol processing`);
    }
    const surface = client.getSurface("main");
    assert.ok(surface?.parseResult?.root, `${scenario} has no rendered root`);
    assert.deepEqual(surface.errors, []);
  }

  console.log(
    `Validated both A2UI envelopes and replayed ${A2UI_SCENARIOS.length} hybrid streams.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
