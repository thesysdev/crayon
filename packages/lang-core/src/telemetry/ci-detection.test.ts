import { describe, expect, it } from "vitest";
import { detectInstallCI } from "./install";
import { detectRuntimeCI } from "./shared";

describe("runtime CI detection", () => {
  it.each([
    [{ GITHUB_ACTIONS: "true" }, { ci: true, name: "github_actions" }],
    [{ GITLAB_CI: "true" }, { ci: true, name: "gitlab_ci" }],
    [{ TF_BUILD: "True" }, { ci: true, name: "azure_pipelines" }],
    [
      { CODEBUILD_BUILD_ARN: "arn:aws:codebuild:region:account:build/project:id" },
      { ci: true, name: "aws_codebuild" },
    ],
    [{ CI: "true" }, { ci: true, name: "unknown" }],
    [
      { CI: "true", VERCEL: "1" },
      { ci: true, name: "vercel" },
    ],
  ])("classifies %o", (env, expected) => {
    expect(detectRuntimeCI(env)).toEqual(expected);
  });

  it("does not classify deployment platform markers as CI at runtime", () => {
    expect(detectRuntimeCI({ VERCEL: "1" })).toEqual({ ci: false });
    expect(detectRuntimeCI({ NETLIFY: "true" })).toEqual({ ci: false });
  });

  it("requires corroborating build metadata for Jenkins", () => {
    expect(detectRuntimeCI({ JENKINS_URL: "https://jenkins.example" })).toEqual({ ci: false });
    expect(detectRuntimeCI({ JENKINS_URL: "https://jenkins.example", BUILD_ID: "123" })).toEqual({
      ci: true,
      name: "jenkins",
    });
  });

  it("does not treat BUILD_NUMBER alone as CI", () => {
    expect(detectRuntimeCI({ BUILD_NUMBER: "42" })).toEqual({ ci: false });
  });

  it("honors an explicit CI=false override", () => {
    expect(detectRuntimeCI({ CI: " false ", GITHUB_ACTIONS: "true" })).toEqual({ ci: false });
    expect(detectRuntimeCI({ CI: "0", GITLAB_CI: "true" })).toEqual({ ci: false });
  });
});

describe("installation CI detection", () => {
  it("maps ci-info provider IDs to bounded telemetry values", () => {
    expect(detectInstallCI({ isCI: true, id: "GITHUB_ACTIONS" })).toEqual({
      ci: true,
      name: "github_actions",
    });
    expect(detectInstallCI({ isCI: true, id: "CODEBUILD" })).toEqual({
      ci: true,
      name: "aws_codebuild",
    });
  });

  it("bounds generic and newly added ci-info providers", () => {
    expect(detectInstallCI({ isCI: true, id: null })).toEqual({ ci: true, name: "unknown" });
    expect(detectInstallCI({ isCI: true, id: "FUTURE_PROVIDER" })).toEqual({
      ci: true,
      name: "other",
    });
    expect(detectInstallCI({ isCI: false, id: null })).toEqual({ ci: false });
  });
});
