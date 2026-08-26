import * as fs from "node:fs";
import * as path from "node:path";

import { fetchGithubFile } from "./github-tarball";
import type { EnvFileHint, ExampleProject } from "./projects";
import { CreateError } from "./telemetry";

export const OPENUI_GITHUB_REPO = "thesysdev/openui";
export const FEATURED_EXAMPLES_PATH = "examples/featured.json";
const CATALOG_TIMEOUT_MS = 15_000;

export function openUiSourceRoots(sourceRoot?: string): string[] {
  return [
    sourceRoot,
    process.env["OPENUI_CLI_SOURCE_ROOT"],
    path.resolve(__dirname, "..", "..", "..", ".."),
  ].filter((root): root is string => Boolean(root));
}

type FeaturedExampleConfig = {
  name?: unknown;
  label?: unknown;
  description?: unknown;
  path?: unknown;
  envFile?: unknown;
  envKey?: unknown;
  aliases?: unknown;
};

function parseFeaturedExamples(raw: string): ExampleProject[] {
  const parsed = JSON.parse(raw) as { examples?: unknown };
  if (!Array.isArray(parsed.examples)) {
    throw new Error(`${FEATURED_EXAMPLES_PATH} must contain an "examples" array.`);
  }

  const examples: ExampleProject[] = [];
  for (const entry of parsed.examples) {
    const item = entry as FeaturedExampleConfig;
    if (
      typeof item.name !== "string" ||
      typeof item.label !== "string" ||
      typeof item.description !== "string" ||
      typeof item.path !== "string"
    ) {
      continue;
    }
    const envFile =
      item.envFile === ".env.local" || item.envFile === ".env" ? item.envFile : ".env";
    const aliases = Array.isArray(item.aliases)
      ? item.aliases.filter((alias): alias is string => typeof alias === "string")
      : undefined;
    examples.push({
      name: item.name,
      label: item.label,
      description: item.description,
      category: "example",
      path: item.path,
      envFile: envFile as EnvFileHint,
      ...(typeof item.envKey === "string" ? { envKey: item.envKey } : {}),
      ...(aliases && aliases.length > 0 ? { aliases } : {}),
    });
  }
  return examples;
}

function readLocalFeaturedExamples(sourceRoot?: string): ExampleProject[] | undefined {
  for (const root of openUiSourceRoots(sourceRoot)) {
    const candidate = path.join(root, FEATURED_EXAMPLES_PATH);
    if (!fs.existsSync(candidate)) continue;
    return parseFeaturedExamples(fs.readFileSync(candidate, "utf8"));
  }
  return undefined;
}

/** Prefetch the featured-example catalog from the local repo or GitHub. */
export async function loadFeaturedExamples(options: {
  sourceRoot?: string;
  ref?: string;
  refPromise?: Promise<string | undefined>;
}): Promise<ExampleProject[]> {
  const local = readLocalFeaturedExamples(options.sourceRoot);
  if (local) return local;

  try {
    const ref = options.ref ?? (await options.refPromise);
    const raw = await fetchGithubFile({
      repo: OPENUI_GITHUB_REPO,
      filePath: FEATURED_EXAMPLES_PATH,
      ref,
      timeoutMs: CATALOG_TIMEOUT_MS,
    });
    return parseFeaturedExamples(raw);
  } catch {
    return [];
  }
}

export function requireFeaturedExamples(examples: ExampleProject[], requested?: string): void {
  if (!requested || examples.length > 0) return;
  throw new CreateError(
    "args_resolution",
    `Could not load featured examples from ${FEATURED_EXAMPLES_PATH}.`,
    "network",
    "FEATURED_CATALOG_UNAVAILABLE",
  );
}
