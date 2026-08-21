import { StreamLanguage } from "@codemirror/language";

/**
 * Minimal CodeMirror 6 highlighter for OpenUI Lang:
 * statements are `name = Component(args)`; "strings"; $stateVars;
 * Capitalized names are components. (The language has no comment syntax.)
 */
export const openuiLang = StreamLanguage.define({
  name: "openui-lang",
  token(stream) {
    if (stream.match(/^"(?:[^"\\]|\\.)*"?/)) return "string";
    if (stream.match(/^\$[A-Za-z_][\w]*/)) return "variableName.special";
    if (stream.match(/^-?\d+(?:\.\d+)?/)) return "number";
    if (stream.match(/^(?:true|false|null)\b/)) return "atom";
    if (stream.match(/^[A-Z][\w]*/)) return "typeName";
    if (stream.match(/^[a-z_][\w]*/)) return "variableName";
    if (stream.match(/^=/)) return "operator";
    if (stream.match(/^[[\]{}(),:]/)) return "punctuation";
    stream.next();
    return null;
  },
});
