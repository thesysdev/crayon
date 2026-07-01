const fs = require("node:fs");
const path = require("node:path");
const { rimrafSync } = require("rimraf");

const TEMPLATES_MAP = [
  { src: "openui-chat", dest: "openui-self-hosted" },
  { src: "openui-cloud", dest: "openui-cloud" },
];

for (const { src, dest } of TEMPLATES_MAP) {
  const srcDir = path.resolve(__dirname, "../src/templates", src);
  const destDir = path.resolve(__dirname, "../dist/templates", dest);

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
