import { fetchSourceFile } from "./checkout";
import type { ExampleProject } from "./projects";
import { CreateError } from "./telemetry";

export const EXAMPLES_CATALOG_PATH = "examples/examples.json";

function catalogError(message: string): CreateError {
  return new CreateError("args_resolution", message, "invalid_input", "EXAMPLES_CATALOG_INVALID");
}

function parseCatalogEntry(item: unknown): ExampleProject {
  const entry = item as { title?: unknown; description?: unknown; path?: unknown };
  if (
    typeof entry.title !== "string" ||
    typeof entry.description !== "string" ||
    typeof entry.path !== "string"
  ) {
    throw catalogError(
      `${EXAMPLES_CATALOG_PATH} has an example missing title, description, or path.`,
    );
  }
  const relative = entry.path.replace(/^\/+/, "");
  const name = relative.split("/").filter(Boolean).at(-1);
  if (!name) {
    throw catalogError(`${EXAMPLES_CATALOG_PATH} has an example with an empty path.`);
  }
  return {
    name,
    label: entry.title,
    description: entry.description,
    category: "example",
    path: relative.startsWith("examples/") ? relative : `examples/${relative}`,
    envFile: ".env",
  };
}

function parseExamplesCatalog(raw: string): ExampleProject[] {
  const parsed = JSON.parse(raw) as { examples?: unknown };
  if (!Array.isArray(parsed.examples) || parsed.examples.length === 0) {
    throw catalogError(`${EXAMPLES_CATALOG_PATH} must contain a non-empty "examples" array.`);
  }
  return parsed.examples.map(parseCatalogEntry);
}

/** Prefetch the examples catalog from GitHub. */
export async function loadExamplesCatalog(): Promise<ExampleProject[]> {
  const { content } = await fetchSourceFile(EXAMPLES_CATALOG_PATH);
  return parseExamplesCatalog(content);
}
