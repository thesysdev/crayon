import type { ElementNode } from "@openuidev/lang-core";

export const A2UI_BENCHMARK_CATALOG_ID = "https://openui.com/catalog/default";

interface A2UIComponent {
  id: string;
  component: string;
  [key: string]: unknown;
}

function isElementNode(value: unknown): value is ElementNode {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const object = value as Record<string, unknown>;
  return object.type === "element" && typeof object.typeName === "string";
}

function sanitizeId(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, "_");
}

export function astToA2UIComponents(root: ElementNode): A2UIComponent[] {
  const components: A2UIComponent[] = [];
  const ids = new WeakMap<object, string>();
  const usedIds = new Set<string>();
  let anonymousId = 0;

  const reserveId = (node: ElementNode, preferred?: string): string => {
    const existing = ids.get(node);
    if (existing) return existing;

    let candidate = preferred ? sanitizeId(preferred) : "";
    if (!candidate || usedIds.has(candidate)) {
      do {
        anonymousId += 1;
        candidate = `c${anonymousId}`;
      } while (usedIds.has(candidate));
    }
    usedIds.add(candidate);
    ids.set(node, candidate);
    return candidate;
  };

  const projectValue = (value: unknown): unknown => {
    if (isElementNode(value)) return visit(value);
    if (Array.isArray(value)) return value.map(projectValue);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value)
          .filter(([, child]) => child !== undefined)
          .map(([key, child]) => [key, projectValue(child)]),
      );
    }
    return value;
  };

  const visit = (node: ElementNode, forcedId?: string): string => {
    const id = reserveId(node, forcedId ?? node.statementId);
    if (components.some((component) => component.id === id)) return id;

    const component: A2UIComponent = { id, component: node.typeName };
    components.push(component);
    for (const [key, value] of Object.entries(node.props)) {
      if (value !== undefined) component[key] = projectValue(value);
    }
    return id;
  };

  visit(root, "root");
  return components;
}

export function splitOpenUIStatements(source: string): string[] {
  const statements: string[] = [];
  let depth = 0;
  let quote: false | '"' | "'" = false;
  let escaped = false;
  let start = 0;

  for (let index = 0; index < source.length; index++) {
    const character = source[index]!;
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quote && character === "\\") {
      escaped = true;
      continue;
    }
    if (quote) {
      if (character === quote) quote = false;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === "(" || character === "[" || character === "{") depth += 1;
    else if (character === ")" || character === "]" || character === "}") {
      depth = Math.max(0, depth - 1);
    } else if (character === "\n" && depth === 0) {
      const statement = source.slice(start, index).trim();
      if (statement) statements.push(statement);
      start = index + 1;
    }
  }

  const finalStatement = source.slice(start).trim();
  if (finalStatement) statements.push(finalStatement);
  return statements;
}

function createSurface(surfaceId: string) {
  return {
    version: "v1.0",
    createSurface: {
      surfaceId,
      catalogId: A2UI_BENCHMARK_CATALOG_ID,
    },
  } as const;
}

function toJsonl(messages: unknown[]): string {
  return `${messages.map((message) => JSON.stringify(message)).join("\n")}\n`;
}

export function astToA2UIJsonStream(root: ElementNode, surfaceId = "main"): string {
  return toJsonl([
    createSurface(surfaceId),
    {
      version: "v1.0",
      updateComponents: {
        surfaceId,
        components: astToA2UIComponents(root),
      },
    },
  ]);
}

export function openUIToA2UILangStream(source: string, surfaceId = "main"): string {
  return toJsonl([
    createSurface(surfaceId),
    {
      version: "v1.0",
      updateComponents: {
        surfaceId,
        components: splitOpenUIStatements(source),
      },
    },
  ]);
}
