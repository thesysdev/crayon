import type { CloudAuthMethod, ResolvedAuthMethod } from "../auth/mint";

export type TemplateName = "openui-self-hosted" | "openui-cloud";

export interface CreateAppOptions {
  name?: string;
  template?: TemplateName;
  skill?: boolean;
  noInteractive?: boolean;
  noInstall?: boolean;
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
