import { source } from "@/lib/source";

export const revalidate = false;

export async function GET() {
  const lines: string[] = [];
  lines.push("# Documentation");
  lines.push("");
  lines.push(
    "- [AGENTS.md — complete agent guide for the Agent Interface SDK](/AGENTS.md): self-contained instructions for coding agents",
  );
  for (const page of source.getPages()) {
    lines.push(`- [${page.data.title}](${page.url}): ${page.data.description}`);
  }
  return new Response(lines.join("\n"));
}
