import type { CloudAuthMethod, ResolvedAuthMethod } from "../auth/mint";

export type TemplateName = "openui-self-hosted" | "openui-cloud";
/** On-disk overlay under `overlays/<name>/`. Selected via `--backend-framework`. */
export type OverlayName = "default" | "langgraph" | "vercel-ai-sdk" | "vercel-eve";

export interface CreateAppOptions {
  name?: string;
  template?: TemplateName;
  backendFramework?: OverlayName;
  skill?: boolean;
  noInteractive?: boolean;
  noInstall?: boolean;
  immediate?: boolean;
  verbose?: boolean;
  apiKey?: string;
  auth?: CloudAuthMethod;
}

export type AiSetup = "openui_cloud" | "openai_compatible_provider";

export type EnvResult = {
  envWritten: boolean;
  envContent?: string;
  authMethod?: ResolvedAuthMethod;
  authSucceeded?: boolean;
};
