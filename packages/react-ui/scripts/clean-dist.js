import fs from "node:fs";

// Equivalent to: rm -rf dist
fs.rmSync("dist", {
  recursive: true,
  force: true,
});
