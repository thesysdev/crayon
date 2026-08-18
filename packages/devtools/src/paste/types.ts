import type { ComponentType } from "react";

export interface ValidationError {
  code: string;
  component: string;
  path: string;
  message: string;
  statementId?: string;
}

export interface ParseResult {
  root: {
    type: "element";
    typeName: string;
    props: Record<string, unknown>;
    partial?: boolean;
    statementId?: string;
  } | null;
  meta: {
    incomplete: boolean;
    unresolved: string[];
    orphaned: string[];
    statementCount: number;
    errors: ValidationError[];
  };
  stateDeclarations?: Record<string, unknown>;
  queryStatements?: unknown[];
  mutationStatements?: unknown[];
}

export interface ParserLike {
  parse(src: string): unknown;
}

export interface StreamParserLike {
  push(chunk: string): unknown;
  getResult(): unknown;
}

export interface LangModule {
  Renderer: ComponentType<{
    response: string | null;
    library: unknown;
    isStreaming?: boolean;
    toolProvider?: unknown;
    onError?: (errors: unknown[]) => void;
    onStateUpdate?: (state: Record<string, unknown>) => void;
    onAction?: (event: unknown) => void;
  }>;
  createParser: (schema: unknown, rootName?: string) => ParserLike;
  createStreamingParser?: (schema: unknown, rootName?: string) => StreamParserLike;
}

export interface ValidationOutcome {
  result: ParseResult | null;
  fatal: string | null;
}

export const EMPTY_OUTCOME: ValidationOutcome = { result: null, fatal: null };
