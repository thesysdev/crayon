const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const cliPath = path.resolve(__dirname, "../dist/index.js");

test("creates a self-hosted scaffold without install or telemetry", () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "openui-cli-smoke-"));
  try {
    const result = spawnSync(
      process.execPath,
      [
        cliPath,
        "--no-telemetry",
        "create",
        "--name",
        "smoke-app",
        "--template",
        "openui-self-hosted",
        "--no-interactive",
        "--no-skill",
        "--no-install",
        "--no-immediate",
      ],
      {
        cwd,
        encoding: "utf8",
        env: { ...process.env, DO_NOT_TRACK: "1" },
      },
    );

    assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.existsSync(path.join(cwd, "smoke-app", "package.json")), true);
    assert.equal(fs.existsSync(path.join(cwd, "smoke-app", ".gitignore")), true);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test("returns a failure for a missing generate entry", () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "openui-cli-generate-"));
  try {
    const result = spawnSync(
      process.execPath,
      [cliPath, "--no-telemetry", "generate", "missing.ts", "--no-interactive"],
      {
        cwd,
        encoding: "utf8",
        env: { ...process.env, DO_NOT_TRACK: "1" },
      },
    );

    assert.equal(result.status, 1);
    assert.match(result.stderr, /File not found/);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test("generates a spec through the buffered worker path", () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "openui-cli-generate-success-"));
  try {
    fs.writeFileSync(
      path.join(cwd, "library.js"),
      "exports.library = { prompt: () => 'hello', toSpec: () => ({ components: [] }), toJSONSchema: () => ({ type: 'object' }) };\n",
    );
    const result = spawnSync(
      process.execPath,
      [cliPath, "--no-telemetry", "generate", "library.js", "--spec", "--no-interactive"],
      {
        cwd,
        encoding: "utf8",
        env: { ...process.env, DO_NOT_TRACK: "1" },
      },
    );

    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), {
      components: [],
      schema: { type: "object" },
    });
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test("records Cloud auth as recoverable when non-interactive setup has no key", () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "openui-cli-cloud-smoke-"));
  try {
    const result = spawnSync(
      process.execPath,
      [
        cliPath,
        "--no-telemetry",
        "create",
        "--name",
        "cloud-app",
        "--template",
        "openui-cloud",
        "--no-interactive",
        "--no-skill",
        "--no-install",
        "--no-immediate",
      ],
      {
        cwd,
        encoding: "utf8",
        env: { ...process.env, DO_NOT_TRACK: "1" },
      },
    );

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stderr, /Could not obtain an API key/);
    assert.match(
      fs.readFileSync(path.join(cwd, "cloud-app", ".env"), "utf8"),
      /^THESYS_API_KEY=$/m,
    );
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});
