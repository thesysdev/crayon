import { fetchSourceFile } from "./checkout";
import { CreateError } from "./telemetry";

export const TEMPLATES_CATALOG_PATH = "templates/templates.json";

export const DEFAULT_TEMPLATE_KEY = "openui-cloud";

export type CatalogOverlay = {
  name: string;
  key: string;
  description: string;
};

export type CatalogTemplate = {
  name: string;
  key: string;
  description: string;
  overlays: CatalogOverlay[];
};

type RawOverlay = {
  name?: unknown;
  key?: unknown;
  description?: unknown;
};

type RawTemplate = {
  name?: unknown;
  key?: unknown;
  description?: unknown;
  overlays?: unknown;
};

function parseOverlay(item: RawOverlay): CatalogOverlay | undefined {
  if (typeof item.name !== "string" || typeof item.key !== "string") return undefined;
  return {
    name: item.name,
    key: item.key,
    description: typeof item.description === "string" ? item.description : item.name,
  };
}

function parseTemplate(item: RawTemplate): CatalogTemplate | undefined {
  if (typeof item.name !== "string" || typeof item.key !== "string") return undefined;
  if (!Array.isArray(item.overlays)) return undefined;
  const overlays = item.overlays
    .map((entry) => parseOverlay(entry as RawOverlay))
    .filter((entry): entry is CatalogOverlay => Boolean(entry));
  if (overlays.length === 0) return undefined;
  return {
    name: item.name,
    key: item.key,
    description: typeof item.description === "string" ? item.description : item.name,
    overlays,
  };
}

function parseTemplatesCatalog(raw: string): CatalogTemplate[] {
  const parsed = JSON.parse(raw) as { templates?: unknown };
  if (!Array.isArray(parsed.templates)) {
    throw new Error(`${TEMPLATES_CATALOG_PATH} must contain a "templates" array.`);
  }
  const templates = parsed.templates
    .map((entry) => parseTemplate(entry as RawTemplate))
    .filter((entry): entry is CatalogTemplate => Boolean(entry));
  if (templates.length === 0) {
    throw new Error(`${TEMPLATES_CATALOG_PATH} has no valid templates.`);
  }
  return templates;
}

/** Prefetch the template catalog from GitHub. */
export async function loadTemplatesCatalog(): Promise<CatalogTemplate[]> {
  try {
    const { content } = await fetchSourceFile(TEMPLATES_CATALOG_PATH);
    return parseTemplatesCatalog(content);
  } catch (err) {
    if (err instanceof CreateError) throw err;
    throw new CreateError(
      "args_resolution",
      `Could not load templates from ${TEMPLATES_CATALOG_PATH}.`,
      "network",
      "TEMPLATE_CATALOG_UNAVAILABLE",
    );
  }
}

export function findCatalogTemplate(templates: CatalogTemplate[], key: string): CatalogTemplate {
  const normalized = key.toLowerCase();
  const match = templates.find((entry) => entry.key.toLowerCase() === normalized);
  if (!match) {
    const available = templates.map((entry) => entry.key).join(" | ") || "(none loaded)";
    throw new CreateError(
      "args_resolution",
      `unknown template "${key}". Use: ${available}.`,
      "invalid_input",
      "INVALID_TEMPLATE",
    );
  }
  return match;
}

export function findCatalogOverlay(template: CatalogTemplate, key: string): CatalogOverlay {
  const normalized = key.toLowerCase();
  const match = template.overlays.find((entry) => entry.key.toLowerCase() === normalized);
  if (!match) {
    const available = template.overlays.map((entry) => entry.key).join(" | ");
    throw new CreateError(
      "args_resolution",
      `unknown backend framework "${key}". Use: ${available}.`,
      "invalid_input",
      "INVALID_BACKEND_FRAMEWORK",
    );
  }
  return match;
}
