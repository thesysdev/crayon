// ─────────────────────────────────────────────────────────────────────────────
// Token types for openui-lang
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Token type discriminant. Uses `const enum` for zero-cost at runtime
 * (TypeScript inlines the numeric values).
 */
export const enum T {
  Newline = 0,
  LParen = 1, // (
  RParen = 2, // )
  LBrack = 3, // [
  RBrack = 4, // ]
  LBrace = 5, // {
  RBrace = 6, // }
  Comma = 7, // ,
  Colon = 8, // :
  Equals = 9, // =
  True = 10,
  False = 11,
  Null = 12,
  EOF = 13,
  Str = 14, // carries string value
  Num = 15, // carries numeric value
  Ident = 16, // lowercase identifier — becomes a reference
  Type = 17, // PascalCase identifier — becomes a component name or reference
  // Reactive & expression tokens
  StateVar = 18, // $identifier — reactive state reference
  Dot = 19, // .
  Plus = 20, // +
  Minus = 21, // -
  Star = 22, // *
  Slash = 23, // /
  Percent = 24, // %
  EqEq = 25, // ==
  NotEq = 26, // !=
  Greater = 27, // >
  Less = 28, // <
  GreaterEq = 29, // >=
  LessEq = 30, // <=
  And = 31, // &&
  Or = 32, // ||
  Not = 33, // !
  Question = 34, // ?
  BuiltinCall = 35, // @identifier — builtin function call
}

export type Token = {
  t: T;
  v?: string | number;
};

/** Reconstruct the text representation of a token. */
export function tokenText(tok: Token): string {
  if (tok.v !== undefined) return String(tok.v);
  switch (tok.t) {
    case T.Newline: return "\n";
    case T.LParen: return "(";
    case T.RParen: return ")";
    case T.LBrack: return "[";
    case T.RBrack: return "]";
    case T.LBrace: return "{";
    case T.RBrace: return "}";
    case T.Comma: return ",";
    case T.Colon: return ":";
    case T.Equals: return "=";
    case T.True: return "true";
    case T.False: return "false";
    case T.Null: return "null";
    case T.Dot: return ".";
    case T.Plus: return "+";
    case T.Minus: return "-";
    case T.Star: return "*";
    case T.Slash: return "/";
    case T.Percent: return "%";
    case T.EqEq: return "==";
    case T.NotEq: return "!=";
    case T.Greater: return ">";
    case T.Less: return "<";
    case T.GreaterEq: return ">=";
    case T.LessEq: return "<=";
    case T.And: return "&&";
    case T.Or: return "||";
    case T.Not: return "!";
    case T.Question: return "?";
    case T.EOF: return "";
    default: return "";
  }
}
