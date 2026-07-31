"use client";

import { createLibrary, defineComponent, type PromptOptions } from "@openuidev/react-lang";
import { Card, MarkDownRenderer } from "@openuidev/react-ui";
import { z } from "zod/v4";
import { HtmlArtifact } from "./html-artifact";

const Markdown = defineComponent({
  name: "Markdown",
  description: "Renders conversational markdown text. Use this for normal replies.",
  props: z.object({
    text: z.string(),
  }),
  component: ({ props }) => <MarkDownRenderer textMarkdown={props.text} />,
});

const Response = defineComponent({
  name: "Response",
  description: "Root container for every reply. Children stack vertically.",
  props: z.object({
    children: z.array(z.union([Markdown.ref, HtmlArtifact.ref])),
  }),
  component: ({ props, renderNode }) => (
    <Card
      width="full"
      style={{ display: "flex", flexDirection: "column", gap: "var(--openui-space-m)" }}
    >
      {renderNode(props.children)}
    </Card>
  ),
});

export const library = createLibrary({
  root: "Response",
  components: [Response, Markdown, HtmlArtifact],
});

export const promptOptions: PromptOptions = {
  additionalRules: [
    "Use Markdown for normal conversation. Most replies are a Response with a single Markdown child.",
    "Only use HtmlArtifact when the user explicitly asks you to build something interactive — an app, game, simulation, visualization, or similar experience.",
    "When you use HtmlArtifact, generate a self-contained HTML/CSS/JavaScript experience in the document argument. It may be a complete HTML document or a fragment.",
    "Inside an HtmlArtifact document: use inline CSS and JavaScript only. Do not depend on external scripts, stylesheets, fonts, images, or network requests.",
    "Do not wrap the document in Markdown fences.",
    "Keep each statement on one line. Encode line breaks as \\n inside the document string.",
    "The document is a double-quoted openui-lang string. Prefer single quotes inside HTML and JavaScript, and escape any double quotes or backslashes.",
  ],
  examples: [
    `Example 1 — a normal reply:

root = Response([answer])
answer = Markdown("Hi! I can chat normally, or build you an interactive HTML experience — try asking for a game, simulator, or visualizer.")`,
    `Example 2 — an interactive artifact:

root = Response([intro, artifact])
intro = Markdown("Here's a simple click counter:")
artifact = HtmlArtifact("Interactive counter", "<!doctype html><html><head><style>body{font-family:system-ui;padding:2rem}button{padding:.5rem 1rem}</style></head><body><h1>Counter</h1><button id='count'>0</button><script>let count=0;document.querySelector('#count').addEventListener('click',event=>{event.currentTarget.textContent=String(++count)})</script></body></html>")`,
  ],
};
