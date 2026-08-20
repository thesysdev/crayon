/**
 * Structural types for whatever version of @openuidev/lang-core the user
 * selects. Never import types from the package itself here — these must
 * compile against ANY published version, old or new (same approach as
 * lang-harness/src/langcore.ts).
 */

export interface ValidationError {
  code: string;
  component: string;
  path: string;
  message: string;
  statementId?: string;
}

export interface OpenUIError {
  source: string;
  code: string;
  message: string;
  component?: string;
  path?: string;
  statementId?: string;
  hint?: string;
}

export interface ElementNode {
  type: "element";
  typeName: string;
  props: Record<string, unknown>;
  partial: boolean;
  statementId?: string;
  hasDynamicProps?: boolean;
}

export interface ParseMeta {
  incomplete: boolean;
  unresolved: string[];
  orphaned: string[];
  statementCount: number;
  errors: ValidationError[];
}

export interface ParseResult {
  root: ElementNode | null;
  meta: ParseMeta;
  stateDeclarations?: Record<string, unknown>;
  queryStatements?: unknown[];
  mutationStatements?: unknown[];
}

export interface ParserLike {
  parse(src: string): ParseResult;
}

export interface StreamParserLike {
  push(chunk: string): ParseResult;
  /** Diffs against internal buffer; resets if text was replaced. Newer versions only. */
  set?(fullText: string): ParseResult;
  getResult(): ParseResult;
}

export interface LangCoreModule {
  createParser?: (schema: unknown, rootName?: string) => ParserLike;
  createStreamingParser?: (schema: unknown, rootName?: string) => StreamParserLike;
  enrichErrors?: (
    errors: ValidationError[],
    schema: unknown,
    componentNames: string[],
  ) => OpenUIError[];
}

export interface LoadedLangCore {
  version: string;
  mod: LangCoreModule;
  /** Where the module actually came from. */
  source: "esm.sh" | "jsdelivr" | "bundled";
  compatible: boolean;
  /** Human-readable reason when compatible === false. */
  reason?: string;
  capabilities: {
    streaming: boolean;
    streamSet: boolean;
    enrich: boolean;
  };
}

export interface VersionGroup {
  /** "0.2", "1.0", ... */
  label: string;
  versions: string[];
}

export interface VersionList {
  groups: VersionGroup[];
  latest: string | null;
}
