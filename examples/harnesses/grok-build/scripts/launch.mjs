// Resolve the coding agent's workspace before starting Next. Grok Build's
// filesystem and shell tools use GROK_BUILD_CWD, so the harness must not
// silently confine every session to this example directory.
//
//   pnpm dev -- /path/to/project        # explicit workspace
//   pnpm dev                            # interactive prompt
//   GROK_BUILD_CWD=/path pnpm dev       # environment override
import { spawn } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";

const NEXT_ARGS = {
  dev: ["dev", "--webpack"],
  start: ["start"],
};

const mode = process.argv[2];
if (!NEXT_ARGS[mode]) {
  console.error(`launch.mjs: unknown mode "${mode}" (expected: dev | start)`);
  process.exit(1);
}

async function chooseWorkspace() {
  const launchArgs = process.argv.slice(3);
  const fromArg = launchArgs[0] === "--" ? launchArgs[1] : launchArgs[0];
  if (fromArg) {
    if (fromArg.startsWith("-")) {
      console.error(`launch.mjs: "${fromArg}" looks like a flag, not a path.`);
      console.error(
        'Pass the workspace after a space-separated "--", e.g.: pnpm dev -- /absolute/path',
      );
      process.exit(1);
    }
    return fromArg;
  }
  if (process.env.GROK_BUILD_CWD) return process.env.GROK_BUILD_CWD;
  if (stdin.isTTY) {
    const rl = createInterface({ input: stdin, output: stdout });
    const answer = (
      await rl.question(`\nWorkspace Grok Build may read, run, and edit in [${process.cwd()}]: `)
    ).trim();
    rl.close();
    return answer || process.cwd();
  }
  return process.cwd();
}

const workspace = resolve(await chooseWorkspace());
if (!existsSync(workspace) || !statSync(workspace).isDirectory()) {
  console.error(`launch.mjs: not a directory: ${workspace}`);
  console.error("Pass an existing directory, e.g.: pnpm dev -- /absolute/path");
  process.exit(1);
}

console.log(`\n  Grok Build workspace: ${workspace}`);
console.log("  Filesystem and shell tools act here and may reach paths outside it.\n");

const child = spawn("next", NEXT_ARGS[mode], {
  stdio: "inherit",
  env: { ...process.env, GROK_BUILD_CWD: workspace },
});

child.on("error", (error) => {
  console.error(`launch.mjs: failed to start Next.js: ${error.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
