import { describe, expect, it } from "vitest";

import {
  classifyProcessFailure,
  classifyUnknownFailure,
  type FailureCategory,
} from "./error-telemetry";
import type { CommandResult } from "./process-runner";

const result = (overrides: Partial<CommandResult> = {}): CommandResult => ({
  succeeded: false,
  exitCode: 1,
  signal: null,
  diagnosticOutput: "",
  durationMs: 100,
  ...overrides,
});

describe("classifyProcessFailure", () => {
  it.each<{
    output: string;
    failureCode: string;
    failureCategory: FailureCategory;
  }>([
    {
      output: "ERR_PNPM_PEER_DEP_ISSUES Unmet peer dependencies",
      failureCode: "ERR_PNPM_PEER_DEP_ISSUES",
      failureCategory: "peer_dependency",
    },
    {
      output: "npm ERR! code ERESOLVE",
      failureCode: "ERESOLVE",
      failureCategory: "peer_dependency",
    },
    {
      output: "YN0002: package doesn't provide a requested peer",
      failureCode: "YARN_PEER_DEPENDENCY",
      failureCategory: "peer_dependency",
    },
    {
      output: "ERR_PNPM_FETCH_401 GET https://private.example.test",
      failureCode: "REGISTRY_401",
      failureCategory: "registry_auth",
    },
    {
      output: "request failed: EAI_AGAIN",
      failureCode: "EAI_AGAIN",
      failureCategory: "dns",
    },
    {
      output: "request failed: ETIMEDOUT",
      failureCode: "ETIMEDOUT",
      failureCategory: "network_timeout",
    },
    {
      output: "connect EHOSTUNREACH",
      failureCode: "NETWORK_UNREACHABLE",
      failureCategory: "network",
    },
    {
      output: "npm ERR! code EBADENGINE",
      failureCode: "ENGINE_MISMATCH",
      failureCategory: "engine_mismatch",
    },
    {
      output: "npm ERR! code ENOSPC",
      failureCode: "DISK_FULL",
      failureCategory: "disk_space",
    },
  ])(
    "maps $failureCode without returning raw output",
    ({ output, failureCode, failureCategory }) => {
      const telemetry = classifyProcessFailure(result({ diagnosticOutput: output }));

      expect(telemetry).toEqual({
        exit_code: 1,
        failure_category: failureCategory,
        failure_code: failureCode,
      });
      expect(JSON.stringify(telemetry)).not.toContain("private.example.test");
    },
  );

  it("maps an interrupt to a cancellation", () => {
    expect(classifyProcessFailure(result({ exitCode: null, signal: "SIGINT" }))).toEqual({
      failure_signal: "SIGINT",
      failure_category: "user_cancelled",
      failure_code: "INTERRUPTED",
      cancellation_exit_code: 130,
    });
  });

  it("maps termination to a cancellation with its own allowlisted code", () => {
    expect(classifyProcessFailure(result({ exitCode: null, signal: "SIGTERM" }))).toEqual({
      failure_signal: "SIGTERM",
      failure_category: "user_cancelled",
      failure_code: "TERMINATED",
      cancellation_exit_code: 143,
    });
  });

  it("prefers a root resource error over a generic lifecycle failure", () => {
    expect(
      classifyProcessFailure(
        result({ diagnosticOutput: "npm ERR! code ELIFECYCLE\nnpm ERR! code ENOSPC" }),
      ),
    ).toEqual({
      exit_code: 1,
      failure_category: "disk_space",
      failure_code: "DISK_FULL",
    });
  });

  it("maps allowlisted spawn errors and drops arbitrary error codes", () => {
    expect(classifyProcessFailure(result({ exitCode: null, spawnErrorCode: "ENOENT" }))).toEqual({
      failure_category: "command_missing",
      failure_code: "COMMAND_NOT_FOUND",
    });

    const unknown = classifyProcessFailure(
      result({
        exitCode: null,
        spawnErrorCode: "PRIVATE_REGISTRY_TOKEN",
        diagnosticOutput: "secret-project-path",
      }),
    );
    expect(unknown).toEqual({
      failure_category: "unknown",
      failure_code: "UNKNOWN",
    });
    expect(JSON.stringify(unknown)).not.toMatch(/PRIVATE_REGISTRY_TOKEN|secret-project-path/);
  });
});

describe("classifyUnknownFailure", () => {
  it("classifies nested process details without returning raw diagnostics", () => {
    const error = new Error("dependency install failed", {
      cause: Object.assign(new Error("pnpm exited"), {
        exitCode: 1,
        stderr: "private/path ERR_PNPM_PEER_DEP_ISSUES secret-value",
      }),
    });

    const telemetry = classifyUnknownFailure(error);

    expect(telemetry).toEqual({
      exit_code: 1,
      failure_category: "peer_dependency",
      failure_code: "ERR_PNPM_PEER_DEP_ISSUES",
    });
    expect(JSON.stringify(telemetry)).not.toMatch(/private\/path|secret-value/);
  });

  it("reports an HTTP status without returning response text", () => {
    const telemetry = classifyUnknownFailure(
      new Error("Failed to create key (HTTP 503): private response"),
    );

    expect(telemetry).toEqual({
      failure_category: "http_error",
      failure_code: "HTTP_503",
      http_status: 503,
    });
    expect(JSON.stringify(telemetry)).not.toContain("private response");
  });
});
