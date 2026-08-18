export type TokenKind =
  | "string"
  | "state"
  | "number"
  | "atom"
  | "type"
  | "ident"
  | "keyword"
  | "operator"
  | "punct"
  | "text";

export interface Token {
  kind: TokenKind;
  value: string;
}

/** Shared by the Debug editor and the devtools stream log. */
export const TOKEN_COLOR: Record<TokenKind, string> = {
  string: "var(--oui-dt-syntax-string)",
  state: "var(--oui-dt-syntax-state)",
  number: "var(--oui-dt-syntax-number)",
  atom: "var(--oui-dt-syntax-atom)",
  type: "var(--oui-dt-syntax-type)",
  ident: "var(--oui-dt-syntax-ident)",
  keyword: "var(--oui-dt-syntax-keyword)",
  operator: "var(--oui-dt-syntax-operator)",
  punct: "var(--oui-dt-syntax-punct)",
  text: "var(--oui-dt-syntax-text)",
};

const RULES: { kind: Exclude<TokenKind, "text">; re: RegExp }[] = [
  { kind: "string", re: /^"(?:[^"\\]|\\.)*"?/ },
  { kind: "state", re: /^\$[A-Za-z_][\w]*/ },
  { kind: "number", re: /^-?\d+(?:\.\d+)?/ },
  { kind: "atom", re: /^(?:true|false|null)\b/ },
  { kind: "type", re: /^[A-Z][\w]*/ },
  { kind: "ident", re: /^[a-z_][\w]*/ },
  { kind: "keyword", re: /^@[A-Za-z_][\w]*/ },
  { kind: "operator", re: /^=/ },
  { kind: "punct", re: /^[[\]{}(),:]/ },
];

/**
 * Regroup tokens into one array per source line, dropping the newlines.
 * The editor renders a row per line so the gutter number stays with its line
 * even when the line soft-wraps. Always returns at least one (empty) line.
 */
export function toTokenLines(tokens: Token[]): Token[][] {
  const lines: Token[][] = [[]];
  for (const token of tokens) {
    const parts = token.value.split("\n");
    for (const [index, part] of parts.entries()) {
      if (index > 0) lines.push([]);
      if (part) lines[lines.length - 1]!.push({ kind: token.kind, value: part });
    }
  }
  return lines;
}

/** Same token rules as the docs highlighter, without CodeMirror. */
export function tokenizeLang(source: string): Token[] {
  const tokens: Token[] = [];
  // Runs of one kind collapse into a single token — the fallback below matches a
  // character at a time, so whitespace would otherwise dominate the output.
  const push = (kind: TokenKind, value: string) => {
    const last = tokens[tokens.length - 1];
    if (last?.kind === kind) last.value += value;
    else tokens.push({ kind, value });
  };

  let i = 0;
  while (i < source.length) {
    const slice = source.slice(i);
    let matched = false;
    for (const rule of RULES) {
      const match = rule.re.exec(slice);
      if (!match) continue;
      const value = match[0];
      const kind: TokenKind = rule.kind === "ident" && value === "root" ? "keyword" : rule.kind;
      push(kind, value);
      i += value.length;
      matched = true;
      break;
    }
    if (!matched) {
      push("text", source[i]!);
      i += 1;
    }
  }
  return tokens;
}
