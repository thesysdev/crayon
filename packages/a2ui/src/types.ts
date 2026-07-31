import type {
  ActionEvent,
  LibraryJSONSchema,
  OpenUIError,
  ParseResult,
} from "@openuidev/lang-core";
import type { z } from "zod/v4";
import type {
  a2uiFunctionCallSchema,
  actionMessageSchema,
  actionResponseMessageSchema,
  agentCapabilitiesSchema,
  agentToRendererMessageSchema,
  callFunctionMessageSchema,
  createSurfaceMessageSchema,
  deleteSurfaceMessageSchema,
  functionResponseMessageSchema,
  genericErrorMessageSchema,
  jsonObjectSchema,
  jsonValueSchema,
  rendererCapabilitiesSchema,
  rendererDataModelSchema,
  rendererToAgentMessageSchema,
  updateComponentsMessageSchema,
  updateDataModelMessageSchema,
  validationFailedErrorMessageSchema,
} from "./protocol-schema";

export type JsonValue = z.infer<typeof jsonValueSchema>;
export type JsonPrimitive = Extract<JsonValue, string | number | boolean | null>;
export type JsonObject = z.infer<typeof jsonObjectSchema>;
export type A2UIFunctionCall = z.infer<typeof a2uiFunctionCallSchema>;
export type CreateSurfaceMessage = z.infer<typeof createSurfaceMessageSchema>;
export type UpdateComponentsMessage = z.infer<typeof updateComponentsMessageSchema>;
export type UpdateDataModelMessage = z.infer<typeof updateDataModelMessageSchema>;
export type DeleteSurfaceMessage = z.infer<typeof deleteSurfaceMessageSchema>;
export type CallFunctionMessage = z.infer<typeof callFunctionMessageSchema>;
export type ActionResponseMessage = z.infer<typeof actionResponseMessageSchema>;
export type AgentToRendererMessage = z.infer<typeof agentToRendererMessageSchema>;
export type ActionMessage = z.infer<typeof actionMessageSchema>;
export type FunctionResponseMessage = z.infer<typeof functionResponseMessageSchema>;
export type ValidationFailedErrorMessage = z.infer<typeof validationFailedErrorMessageSchema>;
export type GenericErrorMessage = z.infer<typeof genericErrorMessageSchema>;
export type RendererToAgentMessage = z.infer<typeof rendererToAgentMessageSchema>;
export type RendererCapabilities = z.infer<typeof rendererCapabilitiesSchema>;
export type AgentCapabilities = z.infer<typeof agentCapabilitiesSchema>;
export type RendererDataModel = z.infer<typeof rendererDataModelSchema>;

export interface SurfaceSnapshot {
  surfaceId: string;
  catalogId?: string;
  surfaceProperties?: JsonObject;
  sendDataModel: boolean;
  source: string;
  dataModel: JsonObject;
  parseResult: ParseResult | null;
  errors: OpenUIError[];
  revision: number;
}

export type A2UIRendererFunction = (args: JsonObject) => JsonValue | Promise<JsonValue>;

export type A2UIFunctionCallableFrom = "rendererOnly" | "agentOnly" | "rendererOrAgent";

export interface A2UIRendererFunctionRegistration {
  handler: A2UIRendererFunction;
  /** Matches A2UI catalog callableFrom semantics. Defaults to rendererOnly. */
  callableFrom?: A2UIFunctionCallableFrom;
}

export interface A2UIClientOptions {
  schema: LibraryJSONSchema;
  rootName?: string;
  functions?: Record<string, A2UIRendererFunction | A2UIRendererFunctionRegistration>;
  rendererCapabilities?: RendererCapabilities;
  onMessage?: (message: RendererToAgentMessage, metadata: RendererMetadata) => void;
  now?: () => Date;
  createId?: () => string;
}

export interface ProtocolValidationIssue {
  path: string;
  message: string;
}

export interface ProcessResult {
  ok: boolean;
  outbound: RendererToAgentMessage[];
  /** Present when malformed input cannot be represented as an A2UI error envelope. */
  issues?: ProtocolValidationIssue[];
}

export interface DispatchActionInput {
  surfaceId: string;
  sourceComponentId: string;
  name: string;
  context?: JsonObject;
  wantResponse?: boolean;
  responsePath?: string;
}

export interface OpenUIActionOptions {
  name?: string;
  /** A2UI component ID to report for the action. Defaults to the Lang statement ID, then root. */
  sourceComponentId?: string;
  context?: JsonObject;
  wantResponse?: boolean;
  responsePath?: string;
}

export type MapOpenUIAction = (event: ActionEvent, surface: SurfaceSnapshot) => OpenUIActionOptions;

export interface RendererMetadata {
  a2uiRendererCapabilities?: RendererCapabilities;
  a2uiRendererDataModel?: RendererDataModel;
}
