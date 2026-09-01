import { fetchSourceFile } from "./checkout";
import type { ExampleProject } from "./projects";
import { CreateError } from "./telemetry";

export const EXAMPLES_CATALOG_PATH = "examples/examples.json";

type CatalogExample = {
  title?: unknown;
  description?: unknown;
  path?: unknown;
  featured?: unknown;
};

function parseFeaturedEntry(item: CatalogExample): ExampleProject | undefined {
  if (item.featured !== true) return undefined;
  if (
    typeof item.title !== "string" ||
    typeof item.description !== "string" ||
    typeof item.path !== "string"
  ) {
    return undefined;
  }
  const relative = item.path.replace(/^\/+/, "");
  const name = relative.split("/").filter(Boolean).at(-1);
  if (!name) return undefined;
  return {
    name,
    label: item.title,
    description: item.description,
    category: "example",
    path: relative.startsWith("examples/") ? relative : `examples/${relative}`,
    envFile: ".env",
  };
}

function parseFeaturedExamples(raw: string): ExampleProject[] {
  const parsed = JSON.parse(raw) as { examples?: unknown };
  if (!Array.isArray(parsed.examples)) {
    throw new Error(`${EXAMPLES_CATALOG_PATH} must contain an "examples" array.`);
  }
  return parsed.examples
    .map((entry) => parseFeaturedEntry(entry as CatalogExample))
    .filter((entry): entry is ExampleProject => Boolean(entry));
}

/** Prefetch featured examples (`featured: true`) from GitHub. */
export async function loadFeaturedExamples(): Promise<ExampleProject[]> {
  try {
    const { content } = await fetchSourceFile(EXAMPLES_CATALOG_PATH);
    return parseFeaturedExamples(content);
  } catch (err) {
    if (err instanceof CreateError) throw err;
    throw new CreateError(
      "args_resolution",
      `Could not load featured examples from ${EXAMPLES_CATALOG_PATH}.`,
      "network",
      "FEATURED_CATALOG_UNAVAILABLE",
    );
  }
}

export function requireFeaturedExamples(examples: ExampleProject[], requested?: string): void {
  if (!requested || examples.length > 0) return;
  throw new CreateError(
    "args_resolution",
    `Could not load featured examples from ${EXAMPLES_CATALOG_PATH}.`,
    "network",
    "FEATURED_CATALOG_UNAVAILABLE",
  );
}
