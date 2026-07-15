const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const test = require("node:test");

const {
  detectAgent,
  normalizeAgentName,
  UNKNOWN_AGENT_NAME,
} = require("../dist/lib/detect-agent.js");

test("detectAgent defaults to unknown", () => {
  assert.equal(detectAgent({}), UNKNOWN_AGENT_NAME);
});

test("detectAgent recognizes supported product markers", () => {
  const cases = [
    [{ CLAUDE_CODE_CHILD_SESSION: "1" }, "claude-code"],
    [{ CLAUDECODE: "1" }, "claude-code"],
    [{ CODEX_THREAD_ID: "thread-123" }, "codex"],
    [{ CLINE_ACTIVE: "true" }, "cline"],
    [{ FACTORY_PROJECT_DIR: "/tmp/project" }, "factory-droid"],
    [{ PI_CODING_AGENT: "1" }, "pi"],
  ];

  for (const [env, expected] of cases) assert.equal(detectAgent(env), expected);
});

test("detectAgent reports conflicting inherited markers as ambiguous", () => {
  assert.equal(
    detectAgent({ CODEX_THREAD_ID: "thread-123", PI_CODING_AGENT: "true" }),
    "ambiguous",
  );
});

test("normalizeAgentName accepts stable slugs and rejects invalid or oversized values", () => {
  assert.equal(normalizeAgentName(" Claude-Code "), "claude-code");
  assert.equal(normalizeAgentName("claude code"), UNKNOWN_AGENT_NAME);
  assert.equal(normalizeAgentName("a".repeat(65)), UNKNOWN_AGENT_NAME);
  assert.equal(normalizeAgentName(), UNKNOWN_AGENT_NAME);
});

test("root and command help document --agent-name", () => {
  const cli = path.join(__dirname, "..", "dist", "index.js");

  for (const command of [undefined, "create", "generate", "generate-spec"]) {
    const args = command ? [cli, command, "--help"] : [cli, "--help"];
    const result = spawnSync(process.execPath, args, {
      encoding: "utf8",
      env: { ...process.env, DO_NOT_TRACK: "1" },
    });
    const help = result.stdout.replace(/\s+/g, " ");
    assert.equal(result.status, 0, result.stderr);
    assert.match(help, /--agent-name <name>/);
    assert.match(help, /AI agents: declare your stable lowercase kebab-case product slug/);
    assert.match(help, /humans can omit/);
    assert.match(help, /default: "unknown"/);
  }
});

test("invalid declared agent names fail with actionable guidance", () => {
  const cli = path.join(__dirname, "..", "dist", "index.js");
  const result = spawnSync(process.execPath, [cli, "create", "--agent-name", "Claude Code"], {
    encoding: "utf8",
    env: { ...process.env, DO_NOT_TRACK: "1" },
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /lowercase kebab-case product slug/);
});
