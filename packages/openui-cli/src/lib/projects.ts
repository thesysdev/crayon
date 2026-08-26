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
}

export type ProjectMetadata = TemplateProject | ExampleProject;

export const STARTER_TEMPLATES: TemplateProject[] = [
  {
    name: "default",
    label: "Default",
    description: "Minimal SDK route",
    category: "template",
  },
  {
    name: "vercel-ai-sdk",
    label: "Vercel AI SDK",
    description: "Vercel AI SDK agent with the selected model backend",
    category: "template",
  },
  {
    name: "langgraph",
    label: "LangGraph",
    description: "LangGraph agent with the selected model backend",
    category: "template",
  },
  {
    name: "vercel-eve",
    label: "Vercel Eve",
    description: "Eve agent rendered through Agent Interface",
    category: "template",
  },
];

export const templateNames = STARTER_TEMPLATES.map((project) => project.name);

export function findTemplate(name: OverlayName): TemplateProject {
  const project = STARTER_TEMPLATES.find((entry) => entry.name === name);
  if (!project) {
    throw new CreateError(
      "args_resolution",
      `unknown backend framework "${name}". Use: ${templateNames.join(" | ")}.`,
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

export async function resolveProject(params: {
  backendFramework?: OverlayName;
  example?: string;
  examples: ExampleProject[];
  interactive: boolean;
}): Promise<ProjectMetadata> {
  const { backendFramework, example, examples, interactive } = params;

  if (example) return findExample(example, examples);
  if (backendFramework) return findTemplate(backendFramework);
  if (!interactive) return findTemplate("default");

  const { select, Separator } = await import("@inquirer/prompts");
  try {
    const choices = [
      new Separator("────── Starter Templates ──────"),
      ...STARTER_TEMPLATES.map((project) => ({
        value: `template:${project.name}`,
        name: project.label,
        description: project.description,
      })),
    ];
    if (examples.length > 0) {
      choices.push(
        new Separator("────── Feature Examples ──────"),
        ...examples.map((project) => ({
          value: `example:${project.name}`,
          name: project.label,
          description: project.description,
        })),
      );
    }

    const selected = await select({
      message: "Select a project to scaffold:",
      choices,
    });

    if (selected.startsWith("example:")) {
      return findExample(selected.slice("example:".length), examples);
    }
    return findTemplate(selected.slice("template:".length) as OverlayName);
  } catch (err) {
    const { ExitPromptError } = await import("@inquirer/core");
    if (err instanceof ExitPromptError) {
      throw new CliCancelledError("args_resolution");
    }
    throw err;
  }
}
