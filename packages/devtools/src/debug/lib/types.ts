import type {
  ParseResult,
  Renderer,
  createParser,
  createStreamingParser,
} from "@openuidev/react-lang";

export type { ElementNode, OpenUIError, ParseResult } from "@openuidev/react-lang";

/** JSON Schema document `createParser` expects — `library.toJSONSchema()`. */
export type LibrarySchema = Parameters<typeof createParser>[0];
export type StreamParser = ReturnType<typeof createStreamingParser>;
export type ValidationError = ParseResult["meta"]["errors"][number];

/**
 * The `@openuidev/react-lang` surface Debug actually calls. Loaded dynamically
 * so the package can stay an optional peer; this type is the compile-time
 * contract for that namespace.
 */
export type LangModule = {
  Renderer: typeof Renderer;
  createParser: typeof createParser;
  createStreamingParser?: typeof createStreamingParser;
};

export interface ValidationOutcome {
  result: ParseResult | null;
  fatal: string | null;
}

export const EMPTY_OUTCOME: ValidationOutcome = { result: null, fatal: null };
