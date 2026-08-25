import assert from "node:assert/strict";
import { test } from "node:test";

import { isPathManaged, synchronizeText } from "./model-policy.mjs";

const role = {
  variants: {
    bare: "gpt-5.5",
    gateway: "openai/gpt-5.5",
    langchain: "openai:gpt-5.5",
    label: "GPT-5.5",
  },
};

test("synchronizes supported OpenAI model identifier formats", () => {
  const input = [
    'model: openai("gpt-4o")',
    'model: "openai/gpt-5.2"',
    'model: "openai:gpt-5.4-mini"',
    "GPT-4o recommended",
  ].join("\n");

  assert.deepEqual(synchronizeText(input, role), {
    text: [
      'model: openai("gpt-5.5")',
      'model: "openai/gpt-5.5"',
      'model: "openai:gpt-5.5"',
      "GPT-5.5 recommended",
    ].join("\n"),
    references: 4,
  });
});

test("does not rewrite unrelated packages or providers", () => {
  const input = [
    'import { encode } from "gpt-tokenizer";',
    'model: "anthropic/claude-opus-4-8"',
    'model: "google/gemini-3.6-flash"',
  ].join("\n");

  assert.deepEqual(synchronizeText(input, role), { text: input, references: 0 });
});

test("managed scope exclusions override broader paths", () => {
  const scope = {
    paths: ["examples", "packages/example/README.md"],
    exclude: [{ path: "examples/provider-catalog", reason: "Different policy" }],
  };

  assert.equal(isPathManaged("examples/chat/route.ts", scope), true);
  assert.equal(isPathManaged("packages/example/README.md", scope), true);
  assert.equal(isPathManaged("examples/provider-catalog/models.ts", scope), false);
  assert.equal(isPathManaged("benchmarks/generate.ts", scope), false);
});
