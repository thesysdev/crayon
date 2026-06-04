import fs from "node:fs";

// Equivalent to: rm -rf dist && mkdir -p dist
fs.rmSync("dist", {
  recursive: true,
  force: true,
});

fs.mkdirSync("dist", {
  recursive: true,
});
