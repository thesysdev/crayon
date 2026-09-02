import { z } from "zod/v4";
import type { LibrarySpec } from "./prompt";

/**
 * Wire shape of a serialized chat library (the `]]>openui:config` `chatLibrary`
 * value). Same as {@link LibrarySpec} without prompt-side `components`.
 */
export type ChatLibrary = Omit<LibrarySpec, "components">;

export interface ChatLibraryIssue {
  code:
    | "invalid-shape"
    | "root-not-found"
    | "unresolved-ref"
    | "unknown-group-component"
    | "invalid-required";
  message: string;
  /** e.g. "$defs/Card/properties/children/items" */
  path?: string;
}

const REF_PATTERN = /^#\/\$defs\/(.+)$/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const componentGroupSchema = z.object({
  name: z.string(),
  components: z.array(z.string()),
  notes: z.array(z.string()).optional(),
});

/**
 * Structural + semantic schema for a customer-supplied chat library.
 * Shape is Zod; `$ref` / root / required / group membership are refinements
 * so every issue is reported (not fail-fast).
 */
export const chatLibrarySchema = z
  .object({
    root: z
      .string()
      .min(1, "chatLibrary.root, when present, must be a non-empty string.")
      .optional(),
    id: z.string().optional(),
    // generate-spec / toSpec() leftover — accepted, never required on the wire
    components: z.unknown().optional(),
    schema: z
      .object({
        $defs: z.record(z.string(), z.unknown()).refine((defs) => Object.keys(defs).length > 0, {
          message: "chatLibrary.schema.$defs must be a non-empty object keyed by component name.",
        }),
      })
      .passthrough(),
    componentGroups: z.array(componentGroupSchema).optional(),
  })
  .passthrough()
  .superRefine((library, ctx) => {
    const defs = library.schema.$defs;
    const defNames = new Set(Object.keys(defs));

    const add = (issue: ChatLibraryIssue) => {
      ctx.addIssue({
        code: "custom",
        message: issue.message,
        path: issue.path ? issue.path.split("/") : [],
        params: { issueCode: issue.code },
      });
    };

    if (library.root && !defNames.has(library.root)) {
      add({
        code: "root-not-found",
        message: `Root component "${library.root}" was not found in schema.$defs. Available components: ${[...defNames].join(", ")}.`,
        path: "root",
      });
    }

    for (const [name, def] of Object.entries(defs)) {
      const defPath = `$defs/${name}`;
      if (!isPlainObject(def)) {
        add({
          code: "invalid-shape",
          message: `${defPath} must be an object component schema.`,
          path: defPath,
        });
        continue;
      }

      const properties = def["properties"];
      if (properties !== undefined && !isPlainObject(properties)) {
        add({
          code: "invalid-shape",
          message: `${defPath}/properties must be an object.`,
          path: `${defPath}/properties`,
        });
      }

      const required = def["required"];
      if (required !== undefined) {
        if (!Array.isArray(required) || required.some((r) => typeof r !== "string")) {
          add({
            code: "invalid-required",
            message: `${defPath}/required must be an array of property names.`,
            path: `${defPath}/required`,
          });
        } else {
          const propKeys = new Set(isPlainObject(properties) ? Object.keys(properties) : []);
          for (const r of required) {
            if (!propKeys.has(r)) {
              add({
                code: "invalid-required",
                message: `${defPath} lists required property "${r}" that is not in properties.`,
                path: `${defPath}/required`,
              });
            }
          }
        }
      }

      collectRefIssues(properties, `${defPath}/properties`, defNames, add);
    }

    for (const [index, group] of (library.componentGroups ?? []).entries()) {
      for (const comp of group.components) {
        if (!defNames.has(comp)) {
          add({
            code: "unknown-group-component",
            message: `Component group "${group.name}" references unknown component "${comp}".`,
            path: `componentGroups/${index}`,
          });
        }
      }
    }
  });

/** Recursively collect every `$ref` and check it resolves within `$defs`. */
function collectRefIssues(
  node: unknown,
  path: string,
  defNames: Set<string>,
  add: (issue: ChatLibraryIssue) => void,
): void {
  if (Array.isArray(node)) {
    node.forEach((item, i) => collectRefIssues(item, `${path}/${i}`, defNames, add));
    return;
  }
  if (!isPlainObject(node)) return;

  const ref = node["$ref"];
  if (typeof ref === "string") {
    const match = REF_PATTERN.exec(ref);
    if (!match || !defNames.has(match[1] as string)) {
      add({
        code: "unresolved-ref",
        message: `Unresolvable $ref "${ref}" at ${path} — refs must be "#/$defs/<name>" pointing at a component in $defs.`,
        path,
      });
    }
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === "$ref") continue;
    collectRefIssues(value, `${path}/${key}`, defNames, add);
  }
}

function pathOf(issue: z.core.$ZodIssue): string | undefined {
  return issue.path.length > 0 ? issue.path.map(String).join("/") : undefined;
}

function shapeMessage(issue: z.core.$ZodIssue, path: string | undefined): string {
  if (path === "root" || path?.startsWith("root")) {
    return "chatLibrary.root, when present, must be a non-empty string.";
  }
  if (path === "schema" || path?.startsWith("schema")) {
    if (path === "schema/$defs" || path === "schema.$defs") {
      return "chatLibrary.schema.$defs must be a non-empty object keyed by component name.";
    }
    if (path === "schema" || issue.code === "invalid_type") {
      return "chatLibrary.schema must be an object with a $defs map of component schemas.";
    }
  }
  if (path?.startsWith("componentGroups")) {
    return "Each componentGroups entry must be {name: string, components: string[], notes?: string[]}.";
  }
  return issue.message;
}

/**
 * Structural validation of a customer-supplied design-system library.
 * Returns ALL issues found (empty array = valid).
 */
export function validateChatLibrary(library: ChatLibrary): ChatLibraryIssue[] {
  if (!isPlainObject(library)) {
    return [
      {
        code: "invalid-shape",
        message: "chatLibrary must be an object.",
      },
    ];
  }

  const result = chatLibrarySchema.safeParse(library);
  if (result.success) return [];

  return result.error.issues.map((issue) => {
    const issueCode = (issue as { params?: { issueCode?: ChatLibraryIssue["code"] } }).params
      ?.issueCode;
    const path = pathOf(issue);
    return {
      code: issueCode ?? "invalid-shape",
      message: issueCode ? issue.message : shapeMessage(issue, path),
      path,
    };
  });
}
