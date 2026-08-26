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
}

export type ProjectMetadata = TemplateProject | ExampleProject;

export const PROJECT_METADATA: ProjectMetadata[] = [
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
  {
    name: "google-adk",
    label: "Google ADK",
    description: "Google ADK TypeScript agent streaming OpenUI Lang",
    category: "example",
    path: "examples/agent-frameworks/google-adk",
    envFile: ".env.local",
    envKey: "GEMINI_API_KEY",
  },
  {
    name: "mastra",
    label: "Mastra",
    description: "Mastra agent connected through AG-UI",
    category: "example",
    path: "examples/agent-frameworks/mastra",
    envFile: ".env.local",
    envKey: "OPENAI_API_KEY",
  },
  {
    name: "vue",
    label: "Vue",
    description: "OpenUI Lang parsing and rendering in Nuxt and Vue",
    category: "example",
    path: "examples/app-frameworks/vue",
    envFile: ".env",
    envKey: "OPENAI_API_KEY",
  },
  {
    name: "svelte",
    label: "Svelte",
    description: "OpenUI Lang parsing and rendering in SvelteKit",
    category: "example",
    path: "examples/app-frameworks/svelte",
    envFile: ".env",
    envKey: "OPENAI_API_KEY",
  },
  {
    name: "react-native",
    label: "React Native",
    description: "Expo client rendering native OpenUI components",
    category: "example",
    path: "examples/app-frameworks/react-native",
    envFile: ".env.local",
  },
  {
    name: "fastapi",
    label: "FastAPI",
    description: "Python FastAPI streaming backend with a React client",
    category: "example",
    path: "examples/app-frameworks/fastapi",
    envFile: ".env",
  },
  {
    name: "material-ui",
    label: "Material UI",
    description: "Material UI component library for generated interfaces",
    category: "example",
    path: "examples/design-systems/material-ui",
    envFile: ".env.local",
    envKey: "OPENAI_API_KEY",
  },
  {
    name: "shadcn",
    label: "shadcn/ui",
    description: "shadcn/ui component library for generated interfaces",
    category: "example",
    path: "examples/design-systems/shadcn",
    envFile: ".env.local",
    envKey: "OPENAI_API_KEY",
  },
  {
    name: "supabase",
    label: "Supabase",
    description: "Persisted conversations and threads with Supabase",
    category: "example",
    path: "examples/miscellaneous/supabase",
    envFile: ".env.local",
  },
  {
    name: "react-email",
    label: "React Email",
    description: "Generate and preview emails with the React Email library",
    category: "example",
    path: "examples/miscellaneous/react-email",
    envFile: ".env",
    envKey: "OPENAI_API_KEY",
  },
  {
    name: "handsontable",
    label: "Handsontable",
    description: "Generated spreadsheet interfaces backed by Handsontable",
    category: "example",
    path: "examples/miscellaneous/handsontable",
    envFile: ".env.local",
    envKey: "OPENAI_API_KEY",
  },
  {
    name: "html-artifact",
    label: "HTML artifact",
    description: "Sandboxed HTML artifacts as an OpenUI capability",
    category: "example",
    path: "examples/miscellaneous/html-artifact",
    envFile: ".env.local",
    envKey: "OPENAI_API_KEY",
  },
];

export const templateNames = PROJECT_METADATA.filter(
  (project): project is TemplateProject => project.category === "template",
).map((project) => project.name);

export const exampleNames = PROJECT_METADATA.filter(
  (project): project is ExampleProject => project.category === "example",
).map((project) => project.name);

const EXAMPLE_ALIASES: Record<string, string> = {
  "shadcn-ui": "shadcn",
  shadcnui: "shadcn",
  mui: "material-ui",
  material: "material-ui",
  rn: "react-native",
  expo: "react-native",
  eve: "vercel-eve",
  adk: "google-adk",
};

export function findTemplate(name: OverlayName): TemplateProject {
  const project = PROJECT_METADATA.find(
    (entry): entry is TemplateProject => entry.category === "template" && entry.name === name,
  );
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

export function findExample(name: string): ExampleProject {
  const normalized = name.toLowerCase();
  const key = EXAMPLE_ALIASES[normalized] ?? normalized;
  const project = PROJECT_METADATA.find(
    (entry): entry is ExampleProject => entry.category === "example" && entry.name === key,
  );
  if (!project) {
    throw new CreateError(
      "args_resolution",
      `unknown example "${name}". Use: ${exampleNames.join(" | ")}.`,
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
  interactive: boolean;
}): Promise<ProjectMetadata> {
  const { backendFramework, example, interactive } = params;

  if (example) return findExample(example);
  if (backendFramework) return findTemplate(backendFramework);
  if (!interactive) return findTemplate("default");

  const { select, Separator } = await import("@inquirer/prompts");
  try {
    const selected = await select({
      message: "Select a project to scaffold:",
      choices: [
        new Separator("────── Starter Templates ──────"),
        ...PROJECT_METADATA.filter((project) => project.category === "template").map((project) => ({
          value: project.name,
          name: project.label,
          description: project.description,
        })),
        new Separator("────── Feature Examples ──────"),
        ...PROJECT_METADATA.filter((project) => project.category === "example").map((project) => ({
          value: project.name,
          name: project.label,
          description: project.description,
        })),
      ],
    });

    return PROJECT_METADATA.find((project) => project.name === selected) ?? findTemplate("default");
  } catch (err) {
    const { ExitPromptError } = await import("@inquirer/core");
    if (err instanceof ExitPromptError) {
      throw new CliCancelledError("args_resolution");
    }
    throw err;
  }
}
