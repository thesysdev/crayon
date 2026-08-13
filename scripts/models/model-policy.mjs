import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MODEL_SUFFIX = String.raw`\d(?:[a-z0-9._-]*[a-z0-9])?`;

const VARIANT_PATTERNS = {
  gateway: new RegExp(String.raw`\bopenai\/gpt-${MODEL_SUFFIX}\b`, "g"),
  langchain: new RegExp(String.raw`\bopenai:gpt-${MODEL_SUFFIX}\b`, "g"),
  bare: new RegExp(String.raw`(?<!openai[/:])\bgpt-${MODEL_SUFFIX}\b`, "g"),
  label:
    /\bGPT-\d(?:\.\d+)*(?:[A-Za-z][A-Za-z0-9.-]*| (?:Mini|mini|Nano|nano|Pro|Sol|Codex|Turbo|Preview|Latest))?\b/g,
};

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function matchesPath(filePath, candidate) {
  return filePath === candidate || filePath.startsWith(`${candidate}/`);
}

export function isPathManaged(filePath, scope) {
  const included = scope.paths.some((candidate) => matchesPath(filePath, candidate));
  const excluded = scope.exclude?.some(({ path: candidate }) => matchesPath(filePath, candidate));

  return included && !excluded;
}

export function synchronizeText(text, role) {
  let synchronized = text;
  let references = 0;

  // Qualified forms must be handled before the bare model pattern.
  for (const variant of ["gateway", "langchain", "bare", "label"]) {
    const pattern = VARIANT_PATTERNS[variant];
    const value = role.variants[variant];

    synchronized = synchronized.replace(pattern, () => {
      references += 1;
      return value;
    });
  }

  return { text: synchronized, references };
}

function readPolicy(repoRoot) {
  const policyPath = path.join(repoRoot, "config/model-policy.json");
  const policy = JSON.parse(readFileSync(policyPath, "utf8"));

  for (const scope of policy.managedScopes ?? []) {
    const role = policy.roles?.[scope.role];
    if (!role) {
      throw new Error(`Unknown model policy role: ${scope.role}`);
    }

    for (const variant of Object.keys(VARIANT_PATTERNS)) {
      if (!role.variants?.[variant]) {
        throw new Error(`Role ${scope.role} is missing the ${variant} variant`);
      }
    }

    for (const exclusion of scope.exclude ?? []) {
      if (!exclusion.path || !exclusion.reason) {
        throw new Error(`Every exclusion for ${scope.role} needs a path and reason`);
      }
    }
  }

  return policy;
}

function repositoryFiles(repoRoot) {
  return execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
    cwd: repoRoot,
    encoding: "utf8",
  })
    .split("\0")
    .filter(Boolean);
}

export function synchronizeRepository({ repoRoot = REPO_ROOT, write = false } = {}) {
  const policy = readPolicy(repoRoot);
  const changes = [];
  let references = 0;

  for (const filePath of repositoryFiles(repoRoot)) {
    const scope = policy.managedScopes.find((candidate) => isPathManaged(filePath, candidate));
    if (!scope) continue;

    const absolutePath = path.join(repoRoot, filePath);
    const buffer = readFileSync(absolutePath);
    if (buffer.includes(0)) continue;

    const original = buffer.toString("utf8");
    const result = synchronizeText(original, policy.roles[scope.role]);
    references += result.references;

    if (result.text === original) continue;

    changes.push({ filePath, role: scope.role });
    if (write) writeFileSync(absolutePath, result.text);
  }

  return { changes, references, policy };
}
