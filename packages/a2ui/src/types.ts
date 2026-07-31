import type {
  ActionEvent,
  LibraryJSONSchema,
  OpenUIError,
  ParseResult,
} from "@openuidev/lang-core";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
  [key: string]: JsonValue;
}

export interface A2UIFunctionCall {
  call: string;
  args?: JsonObject;
}

export interface CreateSurfaceMessage {
  version: "v1.0";
  createSurface: {
    surfaceId: string;
    catalogId?: string;
    surfaceProperties?: JsonObject;
    sendDataModel?: boolean;
    /**
     * A2UI v1.0 single-message surface creation using the profile's OpenUI
     * Lang component representation.
     */
    components?: string[];
    dataModel?: JsonObject;
  };
}

export interface UpdateComponentsMessage {
  version: "v1.0";
  updateComponents: {
    surfaceId: string;
    /** The profile's only wire-level change: A2UI component objects become Lang statements. */
    components: string[];
  };
}

export interface UpdateDataModelMessage {
  version: "v1.0";
  updateDataModel: {
    surfaceId: string;
    path?: string;
    value: JsonValue;
  };
}

export interface DeleteSurfaceMessage {
  version: "v1.0";
  deleteSurface: {
    surfaceId: string;
  };
}

export interface CallFunctionMessage {
  version: "v1.0";
  functionCallId: string;
  wantResponse?: boolean;
  callFunction: A2UIFunctionCall;
}

export interface ActionResponseMessage {
  version: "v1.0";
  actionId: string;
  actionResponse:
    | { value: JsonValue; error?: never }
    | { value?: never; error: { code: string; message: string } };
}

export type AgentToRendererMessage =
  | CreateSurfaceMessage
  | UpdateComponentsMessage
  | UpdateDataModelMessage
  | DeleteSurfaceMessage
  | CallFunctionMessage
  | ActionResponseMessage;

export interface ActionMessage {
  version: "v1.0";
  action: {
    name: string;
    surfaceId: string;
    sourceComponentId: string;
    timestamp: string;
    context: JsonObject;
    wantResponse?: boolean;
    actionId?: string;
  };
}

export interface FunctionResponseMessage {
  version: "v1.0";
  functionResponse: {
    functionCallId: string;
    call: string;
    value: JsonValue;
  };
}

export interface ValidationFailedErrorMessage {
  version: "v1.0";
  error: {
    code: "VALIDATION_FAILED";
    surfaceId: string;
    path: string;
    message: string;
  };
}

export interface GenericErrorMessage {
  version: "v1.0";
  error: {
    code: string;
    message: string;
  } & (
    | { surfaceId: string; functionCallId?: never }
    | { surfaceId?: never; functionCallId: string }
  );
}

export type RendererToAgentMessage =
  | ActionMessage
  | FunctionResponseMessage
  | ValidationFailedErrorMessage
  | GenericErrorMessage;

export interface RendererCapabilities {
  "v1.0": {
    supportedCatalogIds: string[];
    inlineCatalogs?: JsonObject[];
  };
}

export interface AgentCapabilities {
  "v1.0": {
    supportedCatalogIds?: string[];
    acceptsInlineCatalogs?: boolean;
  };
}

export interface RendererDataModel {
  version: "v1.0";
  surfaces: Record<string, JsonObject>;
}

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
