import { describe, expect, it, vi } from "vitest";

import { classifyCloudAuthFailure, CloudAuthError, resolveCloudApiKey } from "./mint";

vi.mock("@inquirer/prompts", () => ({
  password: vi.fn().mockResolvedValue(""),
}));

const baseOptions = {
  projectName: "test-project",
  interactive: true,
};

describe("resolveCloudApiKey", () => {
  it("treats skip as a resolved method, not an auth error", async () => {
    await expect(resolveCloudApiKey({ ...baseOptions, auth: "skip" })).resolves.toEqual({
      key: null,
      method: "skip",
    });
  });

  it("treats an empty manual key as a resolved method, not an auth error", async () => {
    await expect(resolveCloudApiKey({ ...baseOptions, auth: "manual" })).resolves.toEqual({
      key: null,
      method: "manual",
    });
  });

  it("returns a provided key without exposing it through an error", async () => {
    await expect(
      resolveCloudApiKey({ ...baseOptions, apiKey: "  private-api-key  " }),
    ).resolves.toEqual({
      key: "private-api-key",
      method: "apikey-flag",
    });
  });

  it("assigns a safe failure stage when non-interactive credentials are missing", async () => {
    const promise = resolveCloudApiKey({ ...baseOptions, interactive: false });

    await expect(promise).rejects.toBeInstanceOf(CloudAuthError);
    await expect(promise).rejects.toMatchObject({
      stage: "method_resolution",
      method: undefined,
    });
  });
});

describe("classifyCloudAuthFailure", () => {
  it("preserves a nested network cause without returning its raw message", () => {
    const cause = {
      code: "ENOTFOUND",
      message: "request to private registry failed",
    };
    const error = new CloudAuthError(
      "key_mint_request",
      "fetch failed for private tenant",
      "oauth",
      undefined,
      cause,
    );

    const telemetry = classifyCloudAuthFailure(error);

    expect(telemetry).toEqual({
      auth_method: "oauth",
      failure_category: "dns",
      failure_code: "ENOTFOUND",
      failure_stage: "key_mint_request",
    });
    expect(JSON.stringify(telemetry)).not.toMatch(/private registry|private tenant/);
  });

  it("uses a known HTTP status instead of an unknown response parse error", () => {
    const error = new CloudAuthError("key_mint_response", "private response body", "oauth", 503);

    expect(classifyCloudAuthFailure(error)).toEqual({
      auth_method: "oauth",
      failure_category: "http_error",
      failure_code: "HTTP_503",
      failure_stage: "key_mint_response",
      http_status: 503,
    });
  });

  it("promotes a wrapped OAuth response status without treating it as an exit code", () => {
    const responseError = Object.assign(new Error("private OAuth response"), {
      status: 401,
    });
    const error = new CloudAuthError(
      "userinfo",
      "failed to fetch private profile",
      "oauth",
      undefined,
      responseError,
    );

    expect(classifyCloudAuthFailure(error)).toEqual({
      auth_method: "oauth",
      failure_category: "http_error",
      failure_code: "HTTP_401",
      failure_stage: "userinfo",
      http_status: 401,
    });
  });
});
