import type { PromptOptions } from "@openuidev/react-lang";
import { openuiChatLibrary, openuiChatPromptOptions } from "@openuidev/react-ui/genui-lib";

// ── Library ──
//
// Code blocks are no longer registered as openui-lang components; they are
// rendered via the `create_code_block` tool call (see `lib/codeBlockRenderer`)
// and dispatched by `ToolMessageRenderer` in react-ui. The library stays as
// the standard chat library — it still handles all non-code response shapes
// (TextContent, FollowUpBlock, etc.).

export const artifactDemoLibrary = openuiChatLibrary;

// ── Prompt options — instruct the LLM to use the tool for code ──

export const artifactDemoPromptOptions: PromptOptions = {
  ...openuiChatPromptOptions,
  // Override the default preamble — the chat library's default says "ENTIRE
  // response must be valid openui-lang code", which suppresses tool calls.
  // For this example we want both: openui-lang for chat content + tool calls
  // for code blocks rendered via defineArtifactRenderer.
  preamble:
    "You are an AI assistant that responds with TWO INDEPENDENT channels:\n" +
    "1. **openui-lang** — for chat content (intro text, explanations, follow-ups). Must be valid openui-lang starting with `root = Card([...])`.\n" +
    "2. **Tool calls** — for code output via the `create_code_block` tool. Tool calls happen via the OpenAI tools API, separately from openui-lang.\n\n" +
    "Both channels can appear in the same response. Code goes in tool calls; surrounding chat goes in openui-lang. NEVER reference a tool call from inside openui-lang.",
  additionalRules: [
    ...(openuiChatPromptOptions.additionalRules ?? []),
    "Tool calls and openui-lang are INDEPENDENT response channels. Emit them in parallel; do NOT reference tool calls from openui-lang.",
    "For ANY code output, emit a `create_code_block` tool call. NEVER put code inside TextContent, MarkdownBlock, or any openui-lang component. NEVER add a forward reference like `code = ...` for code blocks — they live entirely in the tool call.",
    "Set `title` to the filename (e.g. 'LoginForm.tsx', 'sort.py', 'schema.sql'). Set `language` to the syntax-highlighting language (e.g. 'typescript', 'python', 'sql', 'css').",
    "Call the tool once per file. For multiple files, emit multiple tool calls in a single response.",
    "openui-lang is for the SURROUNDING chat (intro text, brief explanations, follow-up suggestions). Use TextContent + FollowUpBlock as needed. Example shape when responding with code: `root = Card([intro, followUps])` plus one or more parallel `create_code_block` tool calls.",
    "If your only response is code (no surrounding text), emit ONLY the tool call(s) — no openui-lang at all.",
  ],
};

// ── CLI exports — the generate:prompt script expects `library` and `promptOptions` ──

export { artifactDemoLibrary as library, artifactDemoPromptOptions as promptOptions };
