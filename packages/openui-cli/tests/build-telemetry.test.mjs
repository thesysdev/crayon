import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, afterEach, before, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import { build } from "esbuild";

const packageDir = fileURLToPath(new URL("..", import.meta.url));
const bundleDir = mkdtempSync(path.join(tmpdir(), "openui-cli-telemetry-tests-"));
const projectDirs = [];
const originalFetch = globalThis.fetch;
const trackedEnvironment = [
  "BUILDKITE",
  "CI",
  "DO_NOT_TRACK",
  "GITHUB_ACTIONS",
  "GITLAB_CI",
  "OPENUI_POSTHOG_HOST",
  "OPENUI_POSTHOG_KEY",
  "OPENUI_TELEMETRY_DISABLED",
  "THESYS_API_KEY",
];
const originalEnvironment = Object.fromEntries(
  trackedEnvironment.map((name) => [name, process.env[name]]),
);

let buildTelemetry;
let projectTelemetry;

async function bundleAndImport(entry, name) {
  const outfile = path.join(bundleDir, `${name}.mjs`);
  await build({
    entryPoints: [path.join(packageDir, entry)],
    outfile,
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node20",
  });
  return import(pathToFileURL(outfile).href);
}

function restoreEnvironment() {
  for (const name of trackedEnvironment) {
    const original = originalEnvironment[name];
    if (original === undefined) delete process.env[name];
    else process.env[name] = original;
  }
}

function makeProject(
  state = { schemaVersion: 1, projectId: "123e4567-e89b-42d3-a456-426614174000" },
) {
  const projectDir = mkdtempSync(path.join(tmpdir(), "openui-build-telemetry-project-"));
  projectDirs.push(projectDir);

  if (state) {
    mkdirSync(path.join(projectDir, ".openui"), { recursive: true });
    writeFileSync(path.join(projectDir, ".openui", "telemetry.json"), JSON.stringify(state));
  }

  mkdirSync(path.join(projectDir, "node_modules", "next"), { recursive: true });
  writeFileSync(
    path.join(projectDir, "node_modules", "next", "package.json"),
    JSON.stringify({ version: "16.1.6" }),
  );

  return projectDir;
}

before(async () => {
  buildTelemetry = await bundleAndImport(
    "src/templates/openui-cloud/.openui/build-telemetry.ts",
    "build-telemetry",
  );
  projectTelemetry = await bundleAndImport("src/lib/project-telemetry.ts", "project-telemetry");
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  restoreEnvironment();
});

after(() => {
  rmSync(bundleDir, { recursive: true, force: true });
  for (const projectDir of projectDirs) {
    rmSync(projectDir, { recursive: true, force: true });
  }
});

test("production compilation sends only the allowlisted payload", async () => {
  const projectDir = makeProject({
    schemaVersion: 1,
    projectId: "123e4567-e89b-42d3-a456-426614174000",
    ignoredSecret: "marker-secret",
  });
  process.env.OPENUI_POSTHOG_HOST = "https://telemetry.example.test/base";
  process.env.OPENUI_POSTHOG_KEY = "test-public-key";
  process.env.THESYS_API_KEY = "secret-cloud-key";
  process.env.CI = "1";

  let captured;
  globalThis.fetch = async (url, init) => {
    captured = { url: String(url), init };
    return new Response(null, { status: 200 });
  };

  await buildTelemetry.reportOpenUIProductionCompile({
    projectDir,
    distDir: path.join(projectDir, ".next"),
  });

  assert.ok(captured);
  assert.equal(captured.url, "https://telemetry.example.test/i/v0/e/");
  assert.equal(captured.init.method, "POST");
  assert.equal(captured.init.headers["content-type"], "application/json");
  assert.ok(captured.init.signal instanceof AbortSignal);

  const body = String(captured.init.body);
  const payload = JSON.parse(body);
  assert.deepEqual(Object.keys(payload).sort(), ["api_key", "distinct_id", "event", "properties"]);
  assert.equal(payload.api_key, "test-public-key");
  assert.equal(payload.distinct_id, "123e4567-e89b-42d3-a456-426614174000");
  assert.equal(payload.event, "openui_template_production_compile_completed");
  assert.deepEqual(Object.keys(payload.properties).sort(), [
    "$geoip_disable",
    "$process_person_profile",
    "architecture",
    "ci",
    "cloud_key_configured",
    "framework",
    "next_version",
    "node_major_version",
    "platform",
    "project_id",
    "telemetry_schema_version",
    "template",
  ]);
  assert.equal(payload.properties.project_id, payload.distinct_id);
  assert.equal(payload.properties.template, "openui-cloud");
  assert.equal(payload.properties.framework, "nextjs");
  assert.equal(payload.properties.next_version, "16.1.6");
  assert.equal(payload.properties.ci, true);
  assert.equal(payload.properties.cloud_key_configured, true);
  assert.equal(payload.properties.$process_person_profile, false);
  assert.equal(payload.properties.$geoip_disable, true);
  assert.equal(body.includes("secret-cloud-key"), false);
  assert.equal(body.includes("marker-secret"), false);
  assert.equal(body.includes(projectDir), false);
  assert.equal(body.includes(".next"), false);
});

test("the project marker produces a stable project identity", async () => {
  const projectDir = makeProject();
  const distinctIds = [];
  globalThis.fetch = async (_url, init) => {
    distinctIds.push(JSON.parse(String(init.body)).distinct_id);
    return new Response(null, { status: 200 });
  };

  await buildTelemetry.reportOpenUIProductionCompile({ projectDir, distDir: ".next" });
  await buildTelemetry.reportOpenUIProductionCompile({ projectDir, distDir: ".next" });

  assert.deepEqual(distinctIds, [
    "123e4567-e89b-42d3-a456-426614174000",
    "123e4567-e89b-42d3-a456-426614174000",
  ]);
});

test("environment opt-outs suppress the compiler event", async () => {
  const projectDir = makeProject();
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response(null, { status: 200 });
  };

  process.env.DO_NOT_TRACK = "1";
  await buildTelemetry.reportOpenUIProductionCompile({ projectDir, distDir: ".next" });
  delete process.env.DO_NOT_TRACK;

  process.env.OPENUI_TELEMETRY_DISABLED = "true";
  await buildTelemetry.reportOpenUIProductionCompile({ projectDir, distDir: ".next" });

  assert.equal(calls, 0);
});

test("missing or invalid project metadata suppresses the compiler event", async () => {
  const missingStateProject = makeProject(null);
  const invalidStateProject = makeProject({ schemaVersion: 1, projectId: "not-a-uuid" });
  const wrongSchemaProject = makeProject({
    schemaVersion: 2,
    projectId: "123e4567-e89b-42d3-a456-426614174000",
  });
  const malformedStateProject = makeProject();
  writeFileSync(path.join(malformedStateProject, ".openui", "telemetry.json"), "{not-json");
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response(null, { status: 200 });
  };

  await buildTelemetry.reportOpenUIProductionCompile({
    projectDir: missingStateProject,
    distDir: ".next",
  });
  await buildTelemetry.reportOpenUIProductionCompile({
    projectDir: invalidStateProject,
    distDir: ".next",
  });
  await buildTelemetry.reportOpenUIProductionCompile({
    projectDir: wrongSchemaProject,
    distDir: ".next",
  });
  await buildTelemetry.reportOpenUIProductionCompile({
    projectDir: malformedStateProject,
    distDir: ".next",
  });

  assert.equal(calls, 0);
});

test("network failures never fail compilation", async () => {
  const projectDir = makeProject();
  globalThis.fetch = async () => {
    throw new Error("offline");
  };

  await assert.doesNotReject(
    buildTelemetry.reportOpenUIProductionCompile({ projectDir, distDir: ".next" }),
  );
});

test("a stalled telemetry request is capped by the sender timeout", async () => {
  const projectDir = makeProject();
  globalThis.fetch = async (_url, init) =>
    new Promise((_resolve, reject) => {
      init.signal.addEventListener("abort", () => reject(init.signal.reason), { once: true });
    });

  const startedAt = Date.now();
  await assert.doesNotReject(
    buildTelemetry.reportOpenUIProductionCompile({ projectDir, distDir: ".next" }),
  );
  const elapsed = Date.now() - startedAt;

  assert.ok(elapsed >= 750, `expected the one-second timeout, got ${elapsed}ms`);
  assert.ok(elapsed < 2500, `telemetry timeout took too long: ${elapsed}ms`);
});

test("project telemetry state is Cloud-only and best-effort", () => {
  assert.equal(projectTelemetry.createProjectTelemetryState("openui-self-hosted", true), undefined);
  assert.equal(projectTelemetry.createProjectTelemetryState("openui-cloud", false), undefined);

  const state = projectTelemetry.createProjectTelemetryState("openui-cloud", true);
  const otherState = projectTelemetry.createProjectTelemetryState("openui-cloud", true);
  assert.equal(state.schemaVersion, 1);
  assert.match(
    state.projectId,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
  assert.notEqual(state.projectId, otherState.projectId);

  const projectDir = mkdtempSync(path.join(tmpdir(), "openui-project-state-"));
  projectDirs.push(projectDir);
  assert.equal(projectTelemetry.writeProjectTelemetryState(projectDir, state), true);
  assert.deepEqual(
    JSON.parse(readFileSync(path.join(projectDir, ".openui", "telemetry.json"), "utf8")),
    state,
  );

  const blockingFile = path.join(projectDir, "not-a-directory");
  writeFileSync(blockingFile, "file");
  assert.equal(projectTelemetry.writeProjectTelemetryState(blockingFile, state), false);
});

test("CLI opt-outs propagate to generated Cloud projects", () => {
  const cases = [
    { name: "flag", prefixArgs: ["--no-telemetry"], environment: {} },
    { name: "do-not-track", prefixArgs: [], environment: { DO_NOT_TRACK: "1" } },
    {
      name: "openui-disabled",
      prefixArgs: [],
      environment: { OPENUI_TELEMETRY_DISABLED: "1" },
    },
  ];

  for (const testCase of cases) {
    const root = mkdtempSync(path.join(tmpdir(), `openui-cli-opt-out-${testCase.name}-`));
    projectDirs.push(root);
    const projectName = "generated-app";
    const result = spawnSync(
      process.execPath,
      [
        path.join(packageDir, "dist", "index.js"),
        ...testCase.prefixArgs,
        "create",
        "--name",
        projectName,
        "--template",
        "openui-cloud",
        "--api-key",
        "test-key",
        "--no-skill",
        "--no-install",
        "--no-interactive",
      ],
      {
        cwd: root,
        encoding: "utf8",
        env: {
          ...process.env,
          DO_NOT_TRACK: "",
          OPENUI_TELEMETRY_DISABLED: "",
          ...testCase.environment,
        },
        timeout: 15_000,
      },
    );

    assert.equal(result.status, 0, result.stderr || result.stdout);
    const generatedProject = path.join(root, projectName);
    assert.equal(existsSync(path.join(generatedProject, ".openui", "telemetry.json")), false);
    assert.equal(existsSync(path.join(generatedProject, ".openui", "build-telemetry.ts")), true);
  }
});
