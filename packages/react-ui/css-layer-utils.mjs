import fs from "fs";
import path from "path";

// Wrap a CSS file's contents in @layer openui { ... } if not already wrapped.
// Idempotency check protects watch-mode and back-to-back builds.
export function wrapInLayer(content) {
  // Sass emits a UTF-8 BOM for files with non-ASCII output. At byte 0 the
  // decoder strips it, but wrapping would push it inside the layer block,
  // where U+FEFF parses as an identifier and kills the first rule
  // (e.g. the :root theme tokens). Strip it before wrapping.
  content = content.replace(/^\uFEFF/, "");
  if (content.trim() === "") return content;
  if (/^\s*@layer\s+openui\b/.test(content)) return content;
  return `@layer openui{${content}}`;
}

// Write a layered copy of srcFile at destFile, creating parent directories.
export function writeLayeredCopy(srcFile, destFile) {
  const content = fs.readFileSync(srcFile, "utf8");
  fs.mkdirSync(path.dirname(destFile), { recursive: true });
  fs.writeFileSync(destFile, wrapInLayer(content), "utf8");
}

// Mirror every top-level *.css file in srcDir into destDir wrapped in
// @layer openui. Files named in `unwrapped` are copied verbatim — they must
// stay in the unlayered cascade (openui-defaults.css backs the runtime
// theming override contract). Non-CSS files (e.g. cssUtils.scss) are skipped.
export function mirrorStylesWithLayer(srcDir, destDir, unwrapped = ["openui-defaults.css"]) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const name of fs.readdirSync(srcDir)) {
    if (!name.endsWith(".css")) continue;
    const src = path.join(srcDir, name);
    if (!fs.statSync(src).isFile()) continue;
    if (unwrapped.includes(name)) {
      fs.copyFileSync(src, path.join(destDir, name));
    } else {
      writeLayeredCopy(src, path.join(destDir, name));
    }
  }
}
