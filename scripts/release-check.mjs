import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const workspaceSelection = ["--filter", "./packages/**", "--workspace-concurrency=1"];

function run(label, args, options = {}) {
  console.log(`\n==> ${label}`);
  const result = spawnSync(pnpmCommand, args, {
    cwd: options.cwd || repoRoot,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

run("Validate release configuration", ["exec", "node", "scripts/validate-release-config.mjs"]);
run("Build published packages", [...workspaceSelection, "run", "build"]);
run("Run package tests", [...workspaceSelection, "--if-present", "run", "test"]);
run("Run standard type checks", [...workspaceSelection, "--if-present", "run", "typecheck"]);
run("Run Svelte package checks", ["--filter", "@openuidev/svelte-lang", "check"]);
run("Run Vue package checks", ["--filter", "@openuidev/vue-lang", "check"]);
run("Run package lint checks", [...workspaceSelection, "run", "lint:check"]);
run("Run package formatting checks", [...workspaceSelection, "run", "format:check"]);

const publishablePackageDirectories = [
  "browser-bundle",
  "lang-core",
  "openui-cli",
  "react-email",
  "react-headless",
  "react-lang",
  "react-ui",
  "svelte-lang",
  "vue-lang",
];

for (const packageDirectory of publishablePackageDirectories) {
  run(`Run publint for ${packageDirectory}`, [
    "exec",
    "publint",
    join("packages", packageDirectory),
  ]);
}

const typedPackages = [
  ["lang-core", []],
  ["react-email", []],
  ["react-headless", []],
  ["react-lang", []],
  ["react-ui", ["--ignore-rules", "no-resolution"]],
];

for (const [packageDirectory, extraArguments] of typedPackages) {
  run(`Run attw for ${packageDirectory}`, ["exec", "attw", "--pack", ".", ...extraArguments], {
    cwd: join(repoRoot, "packages", packageDirectory),
  });
}

run("Create and inspect release archives", [
  "exec",
  "node",
  "scripts/inspect-release-archives.mjs",
]);

console.log("\nAll release checks passed.");
