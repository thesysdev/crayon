"use client";

import { defineArtifactRenderer } from "@openuidev/react-headless";
import { ArtifactView } from "@/components/ArtifactCodeBlock/ArtifactView";
import { InlinePreview } from "@/components/ArtifactCodeBlock/InlinePreview";

type CodeBlockProps = {
  language: string;
  title: string;
  codeString: string;
};

const isCodeBlockProps = (value: unknown): value is CodeBlockProps =>
  !!value &&
  typeof value === "object" &&
  typeof (value as CodeBlockProps).language === "string" &&
  typeof (value as CodeBlockProps).title === "string" &&
  typeof (value as CodeBlockProps).codeString === "string";

/**
 * Artifact renderer for the `create_code_block` tool call.
 *
 * Code blocks are durable structured outputs — they belong in the artifacts
 * registry (read via `useArtifactList`). The LLM emits a tool call instead of
 * an openui-lang component when it wants to render code. Args are
 * JSON-stringified by OpenAI; this parser deserializes them and validates the
 * shape. Each rendered code block becomes an entry in ThreadContext keyed by
 * its title (filename), and clicking "View Code" opens the full code in the
 * detailed-view side panel.
 */
export const codeBlockRenderer = defineArtifactRenderer({
  type: "code_block",
  toolName: "create_code_block",

  parser: ({ args }) => {
    if (typeof args !== "string") return null;
    try {
      const parsed = JSON.parse(args);
      if (!isCodeBlockProps(parsed)) return null;
      return {
        props: parsed,
        meta: {
          id: parsed.title, // filename is a stable per-block identifier
          version: 1,
          heading: parsed.title,
        },
      };
    } catch {
      return null;
    }
  },

  preview: (props, { open, isActive }) => (
    <InlinePreview
      language={props.language}
      title={props.title}
      codeString={props.codeString}
      open={open}
      isActive={isActive}
    />
  ),

  actual: (props) => (
    <ArtifactView
      language={props.language}
      title={props.title}
      codeString={props.codeString}
    />
  ),
});
