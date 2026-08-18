// Prompts for the json-render protocol: catalog.prompt() and buildUserPrompt()
// from @json-render/core, with guidance passed through its customRules option.
import { REF_PROP_NAMES, catalog, core } from "./catalog.ts";

const { buildUserPrompt } = core;

// catalog.prompt() drops prop-level Zod descriptions, so without these rules the
// model cannot know that ref-typed props take element ids.
const REF_PROP_LIST = [...new Set([...REF_PROP_NAMES.values()].flatMap((s) => [...s]))].join(", ");

const CUSTOM_RULES = [
  `Component-valued props (children, ${REF_PROP_LIST}) contain element-id strings (or arrays of them) referring to entries in /elements. Define each referenced component as its own element.`,
  "Enum-typed fields accept ONLY the listed values, exactly as written.",
  "Every required field must be present, every referenced id must exist, and every element must be reachable from the root.",
];

export function systemPrompt(): string {
  return catalog.prompt({ customRules: CUSTOM_RULES });
}

export function userPrompt(brief: string): string {
  return buildUserPrompt({ prompt: brief });
}
