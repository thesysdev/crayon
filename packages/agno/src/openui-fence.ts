const OPENUI_FENCE_OPENERS = [
  "```openui\n",
  "```openui\r\n",
  "```openui-lang\n",
  "```openui-lang\r\n",
] as const;

const MAX_CLOSING_FENCE_LENGTH = "\r\n```\r\n".length;

/**
 * Remove an optional Markdown fence used to make OpenUI Lang readable in
 * AgentOS. Non-fenced content is returned byte-for-byte unchanged.
 */
export function stripOpenUIFence(content: string): string {
  const opener = OPENUI_FENCE_OPENERS.find((candidate) => content.startsWith(candidate));
  if (!opener) return content;

  const body = content.slice(opener.length);
  const closingFence = body.match(/\r?\n```[\t ]*(?:\r?\n)?$/);
  return closingFence ? body.slice(0, -closingFence[0].length) : body;
}

/** Incrementally remove the AgentOS Markdown wrapper without buffering the UI. */
export class OpenUIFenceStream {
  private mode: "detect" | "fenced" | "passthrough" = "detect";
  private buffer = "";

  push(delta: string): string {
    if (this.mode === "passthrough") return delta;

    this.buffer += delta;

    if (this.mode === "detect") {
      const opener = OPENUI_FENCE_OPENERS.find((candidate) => this.buffer.startsWith(candidate));
      if (opener) {
        this.mode = "fenced";
        this.buffer = this.buffer.slice(opener.length);
      } else if (OPENUI_FENCE_OPENERS.some((candidate) => candidate.startsWith(this.buffer))) {
        return "";
      } else {
        this.mode = "passthrough";
        const content = this.buffer;
        this.buffer = "";
        return content;
      }
    }

    if (this.buffer.length <= MAX_CLOSING_FENCE_LENGTH) return "";

    const safeLength = this.buffer.length - MAX_CLOSING_FENCE_LENGTH;
    const content = this.buffer.slice(0, safeLength);
    this.buffer = this.buffer.slice(safeLength);
    return content;
  }

  finish(): string {
    if (this.mode === "detect") {
      const content = this.buffer;
      this.buffer = "";
      return content;
    }

    if (this.mode === "passthrough") return "";

    const content = this.buffer.replace(/\r?\n```[\t ]*(?:\r?\n)?$/, "");
    this.buffer = "";
    return content;
  }
}
