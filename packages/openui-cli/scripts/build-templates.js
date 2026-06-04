const fs = require("node:fs");
const path = require("node:path");

const srcDir = path.resolve(__dirname, "../src/templates/openui-chat");
const destDir = path.resolve(__dirname, "../dist/templates/openui-chat");

if (!fs.existsSync(srcDir)) {
  throw new Error(`Template source directory not found: ${srcDir}`);
}

// Equivalent to: rm -rf dist/templates/openui-chat
fs.rmSync(destDir, {
  recursive: true,
  force: true,
});

// Equivalent to: mkdir -p dist/templates
fs.mkdirSync(path.dirname(destDir), {
  recursive: true,
});

// Equivalent to: cp -R src/templates/openui-chat dist/templates/openui-chat
fs.cpSync(srcDir, destDir, {
  recursive: true,
});
