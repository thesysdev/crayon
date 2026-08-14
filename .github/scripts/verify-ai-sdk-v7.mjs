import { shouldContinueAfterOpenUIPrompt } from "@openuidev/assistant-ui/ai-sdk";
import { vercelAIAdapter, vercelAIMessageFormat } from "@openuidev/react-headless";
import { convertToModelMessages } from "ai";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { version } = require("ai/package.json");

assert.equal(version.split(".")[0], "7", `Expected AI SDK 7, received ${version}`);

const sse = (chunk) => `data: ${JSON.stringify(chunk)}\n\n`;
const response = new Response(
  [
    { type: "start", messageId: "assistant-1" },
    { type: "start-step" },
    { type: "custom", kind: "openui.progress" },
    {
      type: "reasoning-file",
      url: "data:text/plain;base64,b2s=",
      mediaType: "text/plain",
    },
    { type: "text-start", id: "text-1" },
    { type: "text-delta", id: "text-1", delta: "Ready" },
    { type: "text-end", id: "text-1" },
    {
      type: "tool-input-available",
      toolCallId: "prompt-1",
      toolName: "prompt_openui",
      input: { ui: "root = Card([])" },
    },
    {
      type: "tool-output-available",
      toolCallId: "prompt-1",
      output: { message: "Submit" },
    },
    {
      type: "tool-approval-response",
      approvalId: "approval-1",
      approved: true,
    },
    { type: "finish-step" },
    { type: "finish", finishReason: "stop" },
  ]
    .map(sse)
    .join(""),
  { headers: { "Content-Type": "text/event-stream" } },
);

const events = [];
for await (const event of vercelAIAdapter().parse(response)) {
  events.push(event);
}

assert.deepEqual(
  events.map((event) => event.type),
  [
    "STEP_STARTED",
    "TEXT_MESSAGE_START",
    "TEXT_MESSAGE_CONTENT",
    "TOOL_CALL_START",
    "TOOL_CALL_ARGS",
    "TOOL_CALL_END",
    "TOOL_CALL_RESULT",
    "TEXT_MESSAGE_END",
    "STEP_FINISHED",
  ],
);

const uiMessages = vercelAIMessageFormat.toApi([
  { id: "user-1", role: "user", content: "Show a form" },
  {
    id: "assistant-1",
    role: "assistant",
    content: "Ready",
    toolCalls: [
      {
        id: "prompt-1",
        type: "function",
        function: {
          name: "prompt_openui",
          arguments: JSON.stringify({ ui: "root = Card([])" }),
        },
      },
    ],
  },
  {
    id: "tool-result-prompt-1",
    role: "tool",
    toolCallId: "prompt-1",
    content: JSON.stringify({ message: "Submit" }),
  },
]);

const modelMessages = await convertToModelMessages(uiMessages);
assert.deepEqual(
  modelMessages.map((message) => message.role),
  ["user", "assistant", "tool"],
);

assert.equal(
  shouldContinueAfterOpenUIPrompt({
    messages: [
      {
        id: "assistant-1",
        role: "assistant",
        parts: [
          { type: "step-start" },
          {
            type: "tool-prompt_openui",
            toolCallId: "prompt-1",
            state: "output-available",
            input: { ui: "root = Card([])" },
            output: { message: "Submit" },
          },
        ],
      },
    ],
  }),
  true,
);

console.log(`Verified OpenUI compatibility with AI SDK ${version}.`);
