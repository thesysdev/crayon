import type { ResolvedAuthMethod } from "../auth/mint";

export type TemplateName = "openui-self-hosted" | "openui-cloud";

export interface CreateAppOptions {
  name?: string;
  template?: string;
  skill?: boolean;
  noInteractive?: boolean;
  noInstall?: boolean;
  immediate?: boolean;
  apiKey?: string;
  auth?: string;
}

export type AiSetup = "openui_cloud" | "openai_compatible_provider";

export type EnvResult = {
  envWritten: boolean;
  envContent?: string;
  authMethod?: ResolvedAuthMethod;
  authSucceeded?: boolean;
};
