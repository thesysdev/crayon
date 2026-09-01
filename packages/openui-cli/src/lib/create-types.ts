import type { CloudAuthMethod, ResolvedAuthMethod } from "../auth/mint";

export type TemplateName = "openui-self-hosted" | "openui-cloud";
/** Overlay directory under `templates/<name>/overlays/`, or `default` for the base template. */
export type OverlayName = string;

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
  /** Copy templates from a local OpenUI repo root instead of GitHub. */
  debugSourceRoot?: string;
}

export type AiSetup = "openui_cloud" | "openai_compatible_provider";

export type EnvResult = {
  envWritten: boolean;
  envContent?: string;
  authMethod?: ResolvedAuthMethod;
  authSucceeded?: boolean;
};
