import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import { build } from "esbuild";

const packageDir = fileURLToPath(new URL("..", import.meta.url));
const bundleDir = mkdtempSync(path.join(tmpdir(), "openui-cli-dev-command-tests-"));
let runDevCommand;

before(async () => {
  const outfile = path.join(bundleDir, "run-dev-command.mjs");
  await build({
    entryPoints: [path.join(packageDir, "src/lib/run-dev-command.ts")],
    outfile,
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node20",
  });
  ({ runDevCommand } = await import(pathToFileURL(outfile).href));
});

after(() => {
  rmSync(bundleDir, { recursive: true, force: true });
});

function telemetryRecorder() {
  const events = [];
  return {
    events,
    telemetry: {
      capture(event, properties) {
        events.push({ event, properties });
      },
    },
  };
}

function fakeSpawn(emit) {
  return (command, args, options) => {
    const child = new EventEmitter();
    queueMicrotask(() => emit(child));
    child.invocation = { command, args, options };
    return child;
  };
}

test("runs the package-manager dev command in the generated project", async () => {
  const { events, telemetry } = telemetryRecorder();
  const sigintListeners = process.listenerCount("SIGINT");
  const sigtermListeners = process.listenerCount("SIGTERM");
  let invocation;
  const spawnCommand = (...args) => {
    const child = fakeSpawn((process) => process.emit("close", 0, null))(...args);
    invocation = child.invocation;
    return child;
  };
  const timestamps = [100, 145];

  const result = await runDevCommand(
    "/tmp/generated-app",
    { name: "npm", runCmd: "npm" },
    {
      telemetry,
      spawnCommand,
      now: () => timestamps.shift(),
    },
  );

  assert.deepEqual(invocation, {
    command: "npm",
    args: ["run", "dev"],
    options: {
      cwd: "/tmp/generated-app",
      stdio: "inherit",
      shell: process.platform === "win32",
    },
  });
  assert.deepEqual(result, { status: "stopped", exitCode: 0, signal: null });
  assert.equal(process.listenerCount("SIGINT"), sigintListeners);
  assert.equal(process.listenerCount("SIGTERM"), sigtermListeners);
  assert.deepEqual(events, [
    {
      event: "cli_dev_command_started",
      properties: { package_manager: "npm" },
    },
    {
      event: "cli_dev_command_stopped",
      properties: {
        package_manager: "npm",
        duration_ms: 45,
        exit_code: 0,
        signal: null,
      },
    },
  ]);
});

test("records a non-zero dev-command exit without exposing output", async () => {
  const { events, telemetry } = telemetryRecorder();
  const timestamps = [200, 230];

  const result = await runDevCommand(
    "/private/project",
    { name: "pnpm", runCmd: "pnpm" },
    {
      telemetry,
      spawnCommand: fakeSpawn((child) => child.emit("close", 7, null)),
      now: () => timestamps.shift(),
    },
  );

  assert.deepEqual(result, {
    status: "failed",
    exitCode: 7,
    signal: null,
    reason: "nonzero_exit",
  });
  assert.deepEqual(events[1], {
    event: "cli_dev_command_failed",
    properties: {
      package_manager: "pnpm",
      duration_ms: 30,
      failure_reason: "nonzero_exit",
      exit_code: 7,
      signal: null,
    },
  });
  assert.equal(JSON.stringify(events).includes("/private/project"), false);
});

test("treats Ctrl-C as a normal dev-command stop", async () => {
  const { events, telemetry } = telemetryRecorder();
  const timestamps = [300, 360];

  const result = await runDevCommand(
    "/tmp/project",
    { name: "yarn", runCmd: "yarn" },
    {
      telemetry,
      spawnCommand: fakeSpawn((child) => child.emit("close", null, "SIGINT")),
      now: () => timestamps.shift(),
    },
  );

  assert.deepEqual(result, {
    status: "stopped",
    exitCode: null,
    signal: "SIGINT",
  });
  assert.equal(events[1].event, "cli_dev_command_stopped");
  assert.equal(events[1].properties.signal, "SIGINT");
});

test("treats conventional signal exit codes as normal stops", async () => {
  const { events, telemetry } = telemetryRecorder();
  const timestamps = [360, 380];

  const result = await runDevCommand(
    "/tmp/project",
    { name: "pnpm", runCmd: "pnpm" },
    {
      telemetry,
      spawnCommand: fakeSpawn((child) => child.emit("close", 130, null)),
      now: () => timestamps.shift(),
    },
  );

  assert.deepEqual(result, {
    status: "stopped",
    exitCode: 130,
    signal: null,
  });
  assert.equal(events[1].event, "cli_dev_command_stopped");
  assert.equal(events[1].properties.exit_code, 130);
});

test("normalizes spawn errors for telemetry", async () => {
  const { events, telemetry } = telemetryRecorder();
  const timestamps = [400, 410];
  const error = Object.assign(new Error("command not found: secret-path"), { code: "ENOENT" });

  const result = await runDevCommand(
    "/tmp/project",
    { name: "bun", runCmd: "bun" },
    {
      telemetry,
      spawnCommand: fakeSpawn((child) => child.emit("error", error)),
      now: () => timestamps.shift(),
    },
  );

  assert.deepEqual(result, {
    status: "failed",
    exitCode: 1,
    signal: null,
    reason: "spawn_error",
  });
  assert.deepEqual(events[1], {
    event: "cli_dev_command_failed",
    properties: {
      package_manager: "bun",
      duration_ms: 10,
      failure_reason: "spawn_error",
      error_code: "ENOENT",
    },
  });
  assert.equal(JSON.stringify(events).includes("secret-path"), false);
});
