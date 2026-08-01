import { describe, expect, it, vi } from "vitest";
import {
  INSTALL_EVENT,
  detectCI,
  detectPackageManager,
  hashProjectIdentity,
  normalizeProjectIdentity,
  runInstallTelemetry,
  type InstallTelemetryIO,
  type InstallTelemetryPayload,
} from "./install-telemetry";

const DISTINCT_ID = "00000000-0000-4000-8000-000000000001";
const PROJECT_SALT = "11111111111111111111111111111111";
const RAW_ORIGIN = "https://secret-token@GitHub.com/ThesysDev/OpenUI.git";
const NORMALIZED_ORIGIN = "github.com/ThesysDev/OpenUI";

function createHarness(initialState?: Record<string, unknown>) {
  let storedState = initialState ? JSON.stringify(initialState) : undefined;
  const stderr: string[] = [];
  const io: InstallTelemetryIO = {
    cwd: vi.fn(() => "/work/fallback"),
    homedir: vi.fn(() => "/home/tester"),
    readFile: vi.fn(() => {
      if (storedState === undefined) throw new Error("missing");
      return storedState;
    }),
    writeFile: vi.fn((_file, contents) => {
      storedState = contents;
    }),
    mkdir: vi.fn(),
    getGitOrigin: vi.fn(() => RAW_ORIGIN),
    platform: "darwin",
    architecture: "arm64",
    release: vi.fn(() => "24.5.0"),
    randomUUID: vi.fn(() => DISTINCT_ID),
    randomHex: vi.fn(() => PROJECT_SALT),
    isDocker: vi.fn(() => false),
    stderr: vi.fn((message) => stderr.push(message)),
  };
  const sent: InstallTelemetryPayload[] = [];
  const send = vi.fn(async (payload: InstallTelemetryPayload) => {
    sent.push(payload);
  });

  return {
    io,
    send,
    sent,
    stderr,
    state: () => (storedState ? (JSON.parse(storedState) as Record<string, unknown>) : undefined),
  };
}

function baseEnv(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    INIT_CWD: "/work/project",
    npm_package_version: "0.0.1",
    npm_config_user_agent: "pnpm/10.15.0 npm/? node/v22.19.0 darwin arm64",
    ...overrides,
  };
}

describe("project identity", () => {
  it("normalizes HTTPS, SSH, and SCP-like Git origins consistently", () => {
    expect(normalizeProjectIdentity(RAW_ORIGIN)).toBe(NORMALIZED_ORIGIN);
    expect(normalizeProjectIdentity("ssh://git@github.com/ThesysDev/OpenUI.git")).toBe(
      NORMALIZED_ORIGIN,
    );
    expect(normalizeProjectIdentity("git@github.com:ThesysDev/OpenUI.git")).toBe(NORMALIZED_ORIGIN);
  });

  it("creates a stable salted hash without exposing the identity", () => {
    const first = hashProjectIdentity(PROJECT_SALT, NORMALIZED_ORIGIN);
    expect(first).toBe(hashProjectIdentity(PROJECT_SALT, NORMALIZED_ORIGIN));
    expect(first).not.toContain("github");
    expect(first).not.toBe(
      hashProjectIdentity("22222222222222222222222222222222", NORMALIZED_ORIGIN),
    );
  });
});

describe("bounded environment detection", () => {
  it("parses only package-manager name and version", () => {
    expect(
      detectPackageManager({
        npm_config_user_agent: "pnpm/10.15.0 npm/? node/v22.19.0 darwin arm64",
      }),
    ).toEqual({ name: "pnpm", version: "10.15.0" });
    expect(detectPackageManager({ npm_config_user_agent: "unexpected value" })).toEqual({
      name: "unknown",
    });
  });

  it("reduces CI detection to a known provider", () => {
    expect(detectCI({ CI: "true", GITHUB_ACTIONS: "true" })).toEqual({
      ci: true,
      name: "github_actions",
    });
    expect(detectCI({ CI: "true", UNKNOWN_CI_SECRET: "do-not-send" })).toEqual({
      ci: true,
    });
  });
});

describe("runInstallTelemetry", () => {
  it("sends one allowlisted install event and preserves existing CLI state", async () => {
    const harness = createHarness({
      distinctId: DISTINCT_ID,
      projectSalt: PROJECT_SALT,
      firstRunNoticeShown: true,
      unrelatedFutureField: "preserve-me",
    });

    const result = await runInstallTelemetry({
      env: baseEnv({ GITHUB_ACTIONS: "true" }),
      io: harness.io,
      send: harness.send,
    });

    expect(result.status).toBe("sent");
    expect(harness.sent).toHaveLength(1);
    expect(harness.sent[0]).toEqual({
      distinctId: DISTINCT_ID,
      event: INSTALL_EVENT,
      properties: {
        telemetry_schema_version: 1,
        project_id: hashProjectIdentity(PROJECT_SALT, NORMALIZED_ORIGIN),
        project_id_source: "git_origin",
        devtools_version: "0.0.1",
        node_version: process.version,
        system_platform: "darwin",
        system_release: "24.5.0",
        system_architecture: "arm64",
        package_manager: "pnpm",
        package_manager_version: "10.15.0",
        ci: true,
        ci_name: "github_actions",
        is_docker: false,
      },
    });

    const serializedOutput = JSON.stringify({
      payload: harness.sent[0],
      state: harness.state(),
      stderr: harness.stderr,
    });
    expect(serializedOutput).not.toContain("secret-token");
    expect(serializedOutput).not.toContain("/work/project");
    expect(serializedOutput).not.toContain("ThesysDev/OpenUI");
    expect(harness.state()).toMatchObject({
      distinctId: DISTINCT_ID,
      projectSalt: PROJECT_SALT,
      firstRunNoticeShown: true,
      unrelatedFutureField: "preserve-me",
      devtoolsPostinstallNoticeShown: true,
    });
  });

  it.each([
    ["OPENUI_TELEMETRY_DISABLED", "1"],
    ["OPENUI_TELEMETRY_DISABLED", "TrUe"],
    ["DO_NOT_TRACK", "1"],
  ])("does no telemetry work when %s=%s", async (name, value) => {
    const harness = createHarness();
    const result = await runInstallTelemetry({
      env: { [name]: value },
      io: harness.io,
      send: harness.send,
    });

    expect(result).toEqual({ status: "disabled" });
    expect(harness.io.cwd).not.toHaveBeenCalled();
    expect(harness.io.readFile).not.toHaveBeenCalled();
    expect(harness.io.writeFile).not.toHaveBeenCalled();
    expect(harness.io.getGitOrigin).not.toHaveBeenCalled();
    expect(harness.io.stderr).not.toHaveBeenCalled();
    expect(harness.send).not.toHaveBeenCalled();
  });

  it("prints the exact payload without loading the sender in debug mode", async () => {
    const harness = createHarness();
    const result = await runInstallTelemetry({
      env: baseEnv({ OPENUI_TELEMETRY_DEBUG: "1" }),
      io: harness.io,
      send: harness.send,
    });

    expect(result.status).toBe("debug");
    expect(harness.send).not.toHaveBeenCalled();
    expect(harness.stderr.join("")).toContain('"event": "openui_devtools_installed"');
    expect(harness.stderr.join("")).not.toContain(RAW_ORIGIN);
  });

  it("uses the repository URL and install root fallbacks without sending either raw value", async () => {
    const repositoryHarness = createHarness();
    vi.mocked(repositoryHarness.io.getGitOrigin).mockReturnValue(undefined);
    const repositoryResult = await runInstallTelemetry({
      env: baseEnv({ REPOSITORY_URL: "git@gitlab.com:Private/Project.git" }),
      io: repositoryHarness.io,
      send: repositoryHarness.send,
    });

    expect(repositoryResult.status).toBe("sent");
    expect(repositoryHarness.sent[0].properties.project_id_source).toBe("repository_url");
    expect(JSON.stringify(repositoryHarness.sent[0])).not.toContain("Private/Project");

    const rootHarness = createHarness();
    vi.mocked(rootHarness.io.getGitOrigin).mockReturnValue(undefined);
    const rootResult = await runInstallTelemetry({
      env: baseEnv(),
      io: rootHarness.io,
      send: rootHarness.send,
    });

    expect(rootResult.status).toBe("sent");
    expect(rootHarness.sent[0].properties.project_id_source).toBe("install_root");
    expect(JSON.stringify(rootHarness.sent[0])).not.toContain("/work/project");
  });

  it("never throws or reports success when PostHog delivery fails", async () => {
    const harness = createHarness();
    harness.send.mockRejectedValue(new Error("offline"));

    await expect(
      runInstallTelemetry({
        env: baseEnv(),
        io: harness.io,
        send: harness.send,
      }),
    ).resolves.toMatchObject({ status: "failed" });
  });

  it("continues with ephemeral state when the config directory is read-only", async () => {
    const harness = createHarness();
    vi.mocked(harness.io.writeFile).mockImplementation(() => {
      throw new Error("read-only");
    });

    const result = await runInstallTelemetry({
      env: baseEnv(),
      io: harness.io,
      send: harness.send,
    });

    expect(result.status).toBe("sent");
    expect(harness.sent).toHaveLength(1);
  });
});
