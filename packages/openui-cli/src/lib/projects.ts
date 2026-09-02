import type { OverlayName } from "./create-types";
import { CliCancelledError, CreateError } from "./telemetry";

export type ProjectCategory = "template" | "example";

export type EnvFileHint = ".env" | ".env.local";

export interface TemplateProject {
  name: OverlayName;
  label: string;
  description: string;
  category: "template";
}

export interface ExampleProject {
  name: string;
  label: string;
  description: string;
  category: "example";
  /** Path inside the OpenUI repo, e.g. `examples/app-frameworks/vue`. */
  path: string;
  /** Where the example expects its primary API key. */
  envFile: EnvFileHint;
  /** Primary env var to prompt for. Omit when the example needs several keys. */
  envKey?: string;
  aliases?: string[];
  featured?: boolean;
}

export type ProjectMetadata = TemplateProject | ExampleProject;

export function templatesFromOverlays(
  overlays: Array<{ name: string; label: string; description?: string }>,
): TemplateProject[] {
  return overlays.map((overlay) => ({
    name: overlay.name,
    label: overlay.label,
    description: overlay.description ?? overlay.label,
    category: "template",
  }));
}

export function findTemplate(name: OverlayName, templates: TemplateProject[]): TemplateProject {
  const project = templates.find((entry) => entry.name === name);
  if (!project) {
    const available = templates.map((entry) => entry.name).join(" | ") || "(none loaded)";
    throw new CreateError(
      "args_resolution",
      `unknown backend framework "${name}". Use: ${available}.`,
      "invalid_input",
      "INVALID_BACKEND_FRAMEWORK",
    );
  }
  return project;
}

export function findExample(name: string, examples: ExampleProject[]): ExampleProject {
  const normalized = name.toLowerCase();
  const project = examples.find(
    (entry) =>
      entry.name.toLowerCase() === normalized ||
      entry.aliases?.some((alias) => alias.toLowerCase() === normalized),
  );
  if (!project) {
    const available = examples.map((entry) => entry.name).join(" | ") || "(none loaded)";
    throw new CreateError(
      "args_resolution",
      `unknown example "${name}". Use: ${available}.`,
      "invalid_input",
      "INVALID_EXAMPLE",
    );
  }
  return project;
}

export function rejectConflictingScaffoldSelectors(opts: {
  example?: string;
  backendFramework?: OverlayName;
  template?: string;
}): void {
  if (opts.example && opts.backendFramework) {
    throw new CreateError(
      "bad_args",
      "Cannot use --example with --backend-framework. Choose one scaffold selector.",
      "invalid_input",
      "CONFLICTING_SCAFFOLD_SELECTORS",
    );
  }
  if (opts.example && opts.template) {
    throw new CreateError(
      "bad_args",
      "Cannot use --example with --template. Choose one scaffold selector.",
      "invalid_input",
      "CONFLICTING_SCAFFOLD_SELECTORS",
    );
  }
}

const OPENUI_EXAMPLES_CHOICE = "openui-examples";
const GO_BACK_CHOICE = "back";

const EXAMPLE_CATEGORY_LABELS: Record<string, string> = {
  "agent-frameworks": "Agent frameworks",
  "app-frameworks": "App frameworks",
  "design-systems": "Design systems",
  harnesses: "Harnesses",
  miscellaneous: "Miscellaneous",
};

function exampleCategoryKey(example: ExampleProject): string {
  const relative = example.path.replace(/^examples\//, "");
  return relative.split("/")[0] ?? "miscellaneous";
}

export async function resolveProject(params: {
  backendFramework?: OverlayName;
  example?: string;
  examples: ExampleProject[];
  templates: TemplateProject[];
  interactive: boolean;
}): Promise<ProjectMetadata> {
  const { backendFramework, example, examples, templates, interactive } = params;

  if (example) return findExample(example, examples);
  if (backendFramework) return findTemplate(backendFramework, templates);
  if (!interactive) return findTemplate("default", templates);

  const { select, Separator } = await import("@inquirer/prompts");
  try {
    for (;;) {
      const starterChoices = [
        new Separator("────── Starter Templates ──────"),
        ...templates.map((project) => ({
          value: `template:${project.name}`,
          name: project.label,
          description: project.description,
        })),
      ];
      if (examples.length > 0) {
        starterChoices.push({
          value: OPENUI_EXAMPLES_CHOICE,
          name: "Scaffold from OpenUI Examples",
          description: "Browse examples from the OpenUI repo",
        });
      }

      const selected = await select({
        message: "Select a project to scaffold:",
        choices: starterChoices,
        pageSize: starterChoices.length,
      });

      if (selected !== OPENUI_EXAMPLES_CHOICE) {
        return findTemplate(selected.slice("template:".length) as OverlayName, templates);
      }

      const exampleChoices = [
        { value: GO_BACK_CHOICE, name: "← Back" },
        ...groupedExampleChoices(examples, Separator),
      ];
      const exampleSelected = await select<string>({
        message: "Select an OpenUI example:",
        choices: exampleChoices as never,
        pageSize: exampleChoices.length,
      });
      if (exampleSelected === GO_BACK_CHOICE) continue;
      return findExample(exampleSelected.slice("example:".length), examples);
    }
  } catch (err) {
    const { ExitPromptError } = await import("@inquirer/core");
    if (err instanceof ExitPromptError) {
      throw new CliCancelledError("args_resolution");
    }
    throw err;
  }
}

function groupedExampleChoices(
  examples: ExampleProject[],
  Separator: new (heading?: string) => object,
) {
  const groups = new Map<string, ExampleProject[]>();
  for (const example of examples) {
    const key = exampleCategoryKey(example);
    const group = groups.get(key) ?? [];
    group.push(example);
    groups.set(key, group);
  }

  const choices: Array<object | { value: string; name: string; description: string }> = [];
  for (const [key, group] of groups) {
    choices.push(new Separator(`────── ${EXAMPLE_CATEGORY_LABELS[key] ?? key} ──────`));
    for (const project of group) {
      choices.push({
        value: `example:${project.name}`,
        name: project.label,
        description: project.description,
      });
    }
  }
  return choices;
}
