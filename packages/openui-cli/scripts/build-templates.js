const fs = require("node:fs");
const path = require("node:path");
const { rimrafSync } = require("rimraf");

const TEMPLATES = ["openui-self-hosted", "openui-cloud"];

function shouldCopyTemplatePath(templateDir, src) {
  const rel = path.relative(templateDir, src);
  if (!rel) return true;
  const top = rel.split(path.sep)[0] || "";
  const basename = path.basename(src);

  if (
    ["node_modules", ".next", ".turbo", "dist", "build", "out", "coverage", ".vercel"].includes(
      top,
    )
  ) {
    return false;
  }
  if (top === ".env" || top.startsWith(".env.")) return false;
  return !["next-env.d.ts", "tsconfig.tsbuildinfo"].includes(basename);
}

for (const template of TEMPLATES) {
  const srcDir = path.resolve(__dirname, "../src/templates", template);
  const destDir = path.resolve(__dirname, "../dist/templates", template);

  if (!fs.existsSync(srcDir)) {
    throw new Error(`Template source directory not found: ${srcDir}`);
  }

  // Equivalent to: rm -rf dist/templates/<template>
  fs.rmSync(destDir, { recursive: true, force: true });

  // Equivalent to: mkdir -p dist/templates
  fs.mkdirSync(path.dirname(destDir), { recursive: true });

  // Equivalent to: cp -R src/templates/<template> dist/templates/<template>
  fs.cpSync(srcDir, destDir, {
    recursive: true,
    filter: (src) => shouldCopyTemplatePath(srcDir, src),
  });
}
