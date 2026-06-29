const fs = require("node:fs");
const path = require("node:path");
const { rimrafSync } = require("rimraf");

const TEMPLATES = ["openui-chat", "openui-cloud"];

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
  fs.cpSync(srcDir, destDir, { recursive: true });
}
