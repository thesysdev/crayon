"use client";

import { useThread, useThreadList, type Message } from "@openuidev/react-headless";
import { useMemo, useState } from "react";
import styles from "../chat-page.module.css";
import { getDemoConversation } from "./demo-conversations";

const ARTIFACT_PREFIX = "]]>openui:artifact ";
const EMPTY_MESSAGES: Message[] = [];

export function DemoAuthoringTools() {
  const messages = useThread((state) => state.messages) ?? EMPTY_MESSAGES;
  const isRunning = useThread((state) => state.isRunning);
  const isLoadingMessages = useThread((state) => state.isLoadingMessages);
  const processMessage = useThread((state) => state.processMessage);
  const selectedThreadId = useThreadList((state) => state.selectedThreadId);
  const [copied, setCopied] = useState(false);
  const [prompt, setPrompt] = useState("");
  const output = useMemo(() => getArtifactProgram(messages), [messages]);

  const isDemoThread = getDemoConversation(selectedThreadId) !== undefined;
  const canGenerate = prompt.trim().length > 0 && !isRunning && !isLoadingMessages && !isDemoThread;
  const generate = async () => {
    const content = prompt.trim();
    if (!content || !canGenerate) return;
    setPrompt("");
    await processMessage({ role: "user", content });
  };
  const copyOutput = async () => {
    if (!output) return;
    await copyText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <aside className={styles.demoAuthoringTools} aria-label="Demo authoring tools">
      <div className={styles.demoAuthoringHeader}>
        <div>
          <h2 className={styles.demoAuthoringTitle}>OpenUI Lang</h2>
          <p className={styles.demoAuthoringHint}>
            Generate an artifact, preview it on the left, then copy its source.
          </p>
        </div>
        <span className={styles.demoAuthoringStatus}>
          {isRunning ? "Generating…" : "Claude Sonnet 4.6"}
        </span>
      </div>
      <form
        className={styles.demoAuthoringPrompt}
        onSubmit={(event) => {
          event.preventDefault();
          void generate();
        }}
      >
        <textarea
          className={styles.demoAuthoringPromptInput}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={
            isDemoThread
              ? "Start a new chat before generating an artifact."
              : "Describe the report or slide deck you want to generate…"
          }
          disabled={isDemoThread || isLoadingMessages}
          aria-label="Artifact prompt"
        />
        <button type="submit" className={styles.demoAuthoringGenerate} disabled={!canGenerate}>
          {isRunning ? "Generating…" : "Generate"}
        </button>
      </form>
      <div className={styles.demoAuthoringControls}>
        <button
          type="button"
          className={styles.demoAuthoringCopy}
          onClick={copyOutput}
          disabled={!output}
          data-attribute-element="copy-openui-lang"
        >
          {copied ? "Copied" : "Copy OpenUI Lang"}
        </button>
      </div>
      <textarea
        className={styles.demoAuthoringOutput}
        value={output}
        readOnly
        spellCheck={false}
        aria-label="Raw OpenUI output"
        placeholder="Create an artifact or generate a response to see its raw OpenUI output."
      />
      <p className={styles.demoAuthoringHint}>
        Use the artifact’s View button to keep the rendered result open beside this source.
      </p>
    </aside>
  );
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
}

function getArtifactProgram(messages: Message[]): string {
  const rawArtifact = findLatestArtifactCarrier(messages);
  return findLatestArtifactProgram(messages) || stripArtifactCarrier(rawArtifact);
}

function findLatestArtifactProgram(messages: Message[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "assistant") continue;

    for (const toolCall of [...(message.toolCalls ?? [])].reverse()) {
      try {
        const args = JSON.parse(toolCall.function.arguments) as { artifact_content?: unknown };
        if (typeof args.artifact_content === "string") return args.artifact_content;
      } catch {
        // Streaming tool arguments may be incomplete until generation finishes.
      }
    }
  }

  return "";
}

function findLatestArtifactCarrier(messages: Message[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const content = toText(message?.content);
    if (message?.role === "tool" && content.startsWith(ARTIFACT_PREFIX)) return content;
  }
  return "";
}

function stripArtifactCarrier(content: string): string {
  if (!content.startsWith(ARTIFACT_PREFIX)) return content;
  const firstLineBreak = content.indexOf("\n");
  return firstLineBreak === -1 ? "" : content.slice(firstLineBreak + 1);
}

function toText(content: unknown): string {
  if (typeof content === "string") return content;
  return content == null ? "" : JSON.stringify(content, null, 2);
}
