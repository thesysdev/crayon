import {
  createParser,
  type ActionEvent,
  type OpenUIError,
  type Parser,
  type ValidationError,
} from "@openuidev/lang-core";
import { applyDataModelUpdate, mergeOpenUIStateIntoDataModel, toJsonObject } from "./json-pointer";
import { validateAgentToRendererMessage } from "./runtime-schema";
import { mergeComponentStatements } from "./statement-patch";
import type {
  A2UIClientOptions,
  ActionMessage,
  ActionResponseMessage,
  AgentToRendererMessage,
  DispatchActionInput,
  GenericErrorMessage,
  JsonObject,
  JsonValue,
  OpenUIActionOptions,
  ProcessResult,
  ProtocolValidationIssue,
  RendererDataModel,
  RendererMetadata,
  RendererToAgentMessage,
  SurfaceSnapshot,
  ValidationFailedErrorMessage,
} from "./types";

type SurfaceListener = () => void;
type MessageListener = (message: RendererToAgentMessage, metadata: RendererMetadata) => void;

interface PendingAction {
  surfaceId: string;
  responsePath?: string;
  resolve: (value: JsonValue) => void;
  reject: (error: Error) => void;
}

export class A2UIActionError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "A2UIActionError";
    this.code = code;
  }
}

function defaultId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ?? `a2ui-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

function parseError(error: ValidationError): OpenUIError {
  return {
    source: "parser",
    code: error.code,
    message: error.message,
    statementId: error.statementId,
    component: error.component,
    path: error.path,
  };
}

function isCreateSurface(
  message: AgentToRendererMessage,
): message is Extract<AgentToRendererMessage, { createSurface: unknown }> {
  return "createSurface" in message;
}

function isUpdateComponents(
  message: AgentToRendererMessage,
): message is Extract<AgentToRendererMessage, { updateComponents: unknown }> {
  return "updateComponents" in message;
}

function isUpdateDataModel(
  message: AgentToRendererMessage,
): message is Extract<AgentToRendererMessage, { updateDataModel: unknown }> {
  return "updateDataModel" in message;
}

function isDeleteSurface(
  message: AgentToRendererMessage,
): message is Extract<AgentToRendererMessage, { deleteSurface: unknown }> {
  return "deleteSurface" in message;
}

function isCallFunction(
  message: AgentToRendererMessage,
): message is Extract<AgentToRendererMessage, { callFunction: unknown }> {
  return "callFunction" in message;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function validationTarget(input: unknown): {
  surfaceId?: string;
  functionCallId?: string;
} {
  const message = record(input);
  if (!message) return {};
  const functionCallId =
    typeof message.functionCallId === "string" ? message.functionCallId : undefined;
  for (const key of ["createSurface", "updateComponents", "updateDataModel", "deleteSurface"]) {
    const payload = record(message[key]);
    if (typeof payload?.surfaceId === "string") {
      return { surfaceId: payload.surfaceId, functionCallId };
    }
  }
  return { functionCallId };
}

export class A2UIClient {
  readonly #parser: Parser;
  readonly #functions: A2UIClientOptions["functions"];
  readonly #onMessage?: A2UIClientOptions["onMessage"];
  readonly #rendererCapabilities?: A2UIClientOptions["rendererCapabilities"];
  readonly #now: () => Date;
  readonly #createId: () => string;
  readonly #surfaces = new Map<string, SurfaceSnapshot>();
  readonly #surfaceListeners = new Set<SurfaceListener>();
  readonly #messageListeners = new Set<MessageListener>();
  readonly #pendingActions = new Map<string, PendingAction>();
  #revision = 0;

  constructor(options: A2UIClientOptions) {
    this.#parser = createParser(options.schema, options.rootName);
    this.#functions = options.functions;
    this.#onMessage = options.onMessage;
    this.#rendererCapabilities = options.rendererCapabilities;
    this.#now = options.now ?? (() => new Date());
    this.#createId = options.createId ?? defaultId;
  }

  subscribe(listener: SurfaceListener): () => void {
    this.#surfaceListeners.add(listener);
    return () => this.#surfaceListeners.delete(listener);
  }

  subscribeMessages(listener: MessageListener): () => void {
    this.#messageListeners.add(listener);
    return () => this.#messageListeners.delete(listener);
  }

  getSurface(surfaceId: string): SurfaceSnapshot | undefined {
    return this.#surfaces.get(surfaceId);
  }

  getSurfaces(): SurfaceSnapshot[] {
    return [...this.#surfaces.values()];
  }

  getRendererDataModel(): RendererDataModel | undefined {
    const surfaces = Object.fromEntries(
      [...this.#surfaces]
        .filter(([, surface]) => surface.sendDataModel)
        .map(([surfaceId, surface]) => [surfaceId, structuredClone(surface.dataModel)]),
    );
    if (Object.keys(surfaces).length === 0) return undefined;
    return {
      version: "v1.0",
      surfaces,
    };
  }

  getRendererMetadata(): RendererMetadata {
    const dataModel = this.getRendererDataModel();
    return {
      ...(this.#rendererCapabilities
        ? { a2uiRendererCapabilities: structuredClone(this.#rendererCapabilities) }
        : {}),
      ...(dataModel ? { a2uiRendererDataModel: dataModel } : {}),
    };
  }

  async process(input: unknown): Promise<ProcessResult> {
    const outbound: RendererToAgentMessage[] = [];
    const capture = (next: RendererToAgentMessage) => outbound.push(next);
    this.#messageListeners.add(capture);
    try {
      const validated = validateAgentToRendererMessage(input);
      if (!validated.success) return this.#invalidMessage(input, validated.issues, outbound);
      const message = validated.message;

      if (isCreateSurface(message)) return this.#createSurface(message, outbound);
      if (isUpdateComponents(message)) return this.#updateComponents(message, outbound);
      if (isUpdateDataModel(message)) return this.#updateDataModel(message, outbound);
      if (isDeleteSurface(message)) return this.#deleteSurface(message, outbound);
      if (isCallFunction(message)) return await this.#callFunction(message, outbound);
      return this.#actionResponse(message, outbound);
    } finally {
      this.#messageListeners.delete(capture);
    }
  }

  updateSurfaceFromOpenUIState(surfaceId: string, state: Record<string, unknown>): boolean {
    const surface = this.#surfaces.get(surfaceId);
    if (!surface) return false;
    const dataModel = mergeOpenUIStateIntoDataModel(surface.dataModel, state);
    if (JSON.stringify(dataModel) === JSON.stringify(surface.dataModel)) return false;
    this.#replaceSurface({
      ...surface,
      dataModel,
    });
    return true;
  }

  dispatchOpenUIAction(
    surfaceId: string,
    event: ActionEvent,
    options: OpenUIActionOptions = {},
  ): Promise<JsonValue> | undefined {
    const eventSourceComponentId = (event as ActionEvent & { sourceComponentId?: unknown })
      .sourceComponentId;
    const context: JsonObject = {
      ...toJsonObject(event.params),
      ...(event.formState ? { formState: toJsonObject(event.formState) } : {}),
      ...options.context,
    };
    return this.dispatchAction({
      surfaceId,
      sourceComponentId:
        options.sourceComponentId ??
        (typeof eventSourceComponentId === "string" ? eventSourceComponentId : "root"),
      name: options.name ?? event.type,
      context,
      wantResponse: options.wantResponse,
      responsePath: options.responsePath,
    });
  }

  dispatchAction(input: DispatchActionInput): Promise<JsonValue> | undefined {
    if (!this.#surfaces.has(input.surfaceId)) {
      this.#emitGenericError(
        "SURFACE_NOT_FOUND",
        `Unknown surface: ${input.surfaceId}`,
        input.surfaceId,
      );
      return undefined;
    }

    const actionId = input.wantResponse ? this.#createId() : undefined;
    const message: ActionMessage = {
      version: "v1.0",
      action: {
        name: input.name,
        surfaceId: input.surfaceId,
        sourceComponentId: input.sourceComponentId,
        timestamp: this.#now().toISOString(),
        context: input.context ?? {},
        ...(input.wantResponse ? { wantResponse: true, actionId } : {}),
      },
    };
    this.#emit(message);

    if (!actionId) return undefined;
    return new Promise<JsonValue>((resolve, reject) => {
      this.#pendingActions.set(actionId, {
        surfaceId: input.surfaceId,
        responsePath: input.responsePath,
        resolve,
        reject,
      });
    });
  }

  dispose(): void {
    for (const pending of this.#pendingActions.values()) {
      pending.reject(new A2UIActionError("CLIENT_DISPOSED", "A2UI client was disposed"));
    }
    this.#pendingActions.clear();
    this.#surfaces.clear();
    this.#surfaceListeners.clear();
    this.#messageListeners.clear();
  }

  #createSurface(
    message: Extract<AgentToRendererMessage, { createSurface: unknown }>,
    outbound: RendererToAgentMessage[],
  ): ProcessResult {
    const input = message.createSurface;
    if (this.#surfaces.has(input.surfaceId)) {
      this.#emitGenericError(
        "SURFACE_ALREADY_EXISTS",
        `Surface already exists: ${input.surfaceId}`,
        input.surfaceId,
      );
      return { ok: false, outbound };
    }
    const supportedCatalogIds = this.#rendererCapabilities?.["v1.0"].supportedCatalogIds ?? [];
    if (
      input.catalogId &&
      supportedCatalogIds.length > 0 &&
      !supportedCatalogIds.includes(input.catalogId)
    ) {
      this.#emitGenericError(
        "UNSUPPORTED_CATALOG",
        `Renderer does not support catalog: ${input.catalogId}`,
        input.surfaceId,
      );
      return { ok: false, outbound };
    }

    let source = "";
    let parseResult: SurfaceSnapshot["parseResult"] = null;
    let errors: OpenUIError[] = [];
    if (input.components) {
      try {
        ({ source, parseResult, errors } = this.#mergeComponents("", input.components));
      } catch (error) {
        this.#emitValidationError(
          input.surfaceId,
          "/createSurface/components",
          error instanceof Error ? error.message : String(error),
        );
        return { ok: false, outbound };
      }
    }
    this.#replaceSurface({
      surfaceId: input.surfaceId,
      catalogId: input.catalogId,
      surfaceProperties: input.surfaceProperties,
      sendDataModel: input.sendDataModel ?? false,
      source,
      dataModel: structuredClone(input.dataModel ?? {}),
      parseResult,
      errors,
      revision: 0,
    });
    for (const error of errors) {
      this.#emitValidationError(
        input.surfaceId,
        "/createSurface/components",
        error.statementId ? `${error.statementId}: ${error.message}` : error.message,
      );
    }
    return { ok: errors.length === 0, outbound };
  }

  #updateComponents(
    message: Extract<AgentToRendererMessage, { updateComponents: unknown }>,
    outbound: RendererToAgentMessage[],
  ): ProcessResult {
    const input = message.updateComponents;
    const surface = this.#requireSurface(input.surfaceId);
    if (!surface) return { ok: false, outbound };
    try {
      const { source, parseResult, errors } = this.#mergeComponents(
        surface.source,
        input.components,
      );
      this.#replaceSurface({ ...surface, source, parseResult, errors });
      for (const error of errors) {
        this.#emitValidationError(
          input.surfaceId,
          "/updateComponents/components",
          error.statementId ? `${error.statementId}: ${error.message}` : error.message,
        );
      }
      return { ok: errors.length === 0, outbound };
    } catch (error) {
      this.#emitValidationError(
        input.surfaceId,
        "/updateComponents/components",
        error instanceof Error ? error.message : String(error),
      );
      return { ok: false, outbound };
    }
  }

  #updateDataModel(
    message: Extract<AgentToRendererMessage, { updateDataModel: unknown }>,
    outbound: RendererToAgentMessage[],
  ): ProcessResult {
    const input = message.updateDataModel;
    const surface = this.#requireSurface(input.surfaceId);
    if (!surface) return { ok: false, outbound };
    try {
      const dataModel = applyDataModelUpdate(surface.dataModel, input.path, input.value);
      this.#replaceSurface({ ...surface, dataModel });
      return { ok: true, outbound };
    } catch (error) {
      this.#emitValidationError(
        input.surfaceId,
        "/updateDataModel/path",
        error instanceof Error ? error.message : String(error),
      );
      return { ok: false, outbound };
    }
  }

  #deleteSurface(
    message: Extract<AgentToRendererMessage, { deleteSurface: unknown }>,
    outbound: RendererToAgentMessage[],
  ): ProcessResult {
    const surfaceId = message.deleteSurface.surfaceId;
    if (!this.#requireSurface(surfaceId)) return { ok: false, outbound };
    this.#surfaces.delete(surfaceId);
    for (const [actionId, pending] of this.#pendingActions) {
      if (pending.surfaceId === surfaceId) {
        pending.reject(new A2UIActionError("SURFACE_DELETED", `Surface was deleted: ${surfaceId}`));
        this.#pendingActions.delete(actionId);
      }
    }
    this.#notify();
    return { ok: true, outbound };
  }

  async #callFunction(
    message: Extract<AgentToRendererMessage, { callFunction: unknown }>,
    outbound: RendererToAgentMessage[],
  ): Promise<ProcessResult> {
    const { call, args = {} } = message.callFunction;
    const registration = this.#functions?.[call];
    if (!registration) {
      this.#emitGenericError(
        "INVALID_FUNCTION_CALL",
        `Renderer function is not registered: ${call}`,
        undefined,
        message.functionCallId,
      );
      return { ok: false, outbound };
    }
    const fn = typeof registration === "function" ? registration : registration.handler;
    if (
      typeof registration !== "function" &&
      (registration.callableFrom ?? "rendererOnly") === "rendererOnly"
    ) {
      this.#emitGenericError(
        "INVALID_FUNCTION_CALL",
        `Renderer function is not callable from the agent: ${call}`,
        undefined,
        message.functionCallId,
      );
      return { ok: false, outbound };
    }
    try {
      const value = await fn(args);
      if (message.wantResponse) {
        this.#emit({
          version: "v1.0",
          functionResponse: { functionCallId: message.functionCallId, call, value },
        });
      }
      return { ok: true, outbound };
    } catch (error) {
      this.#emitGenericError(
        "FUNCTION_CALL_FAILED",
        error instanceof Error ? error.message : String(error),
        undefined,
        message.functionCallId,
      );
      return { ok: false, outbound };
    }
  }

  #actionResponse(
    message: ActionResponseMessage,
    outbound: RendererToAgentMessage[],
  ): ProcessResult {
    const pending = this.#pendingActions.get(message.actionId);
    if (!pending) {
      return {
        ok: false,
        outbound,
        issues: [{ path: "/actionId", message: `Unknown actionId: ${message.actionId}` }],
      };
    }
    this.#pendingActions.delete(message.actionId);
    if ("error" in message.actionResponse) {
      pending.reject(
        new A2UIActionError(
          message.actionResponse.error.code,
          message.actionResponse.error.message,
        ),
      );
      return { ok: true, outbound };
    }
    const value = message.actionResponse.value;
    if (pending.responsePath) {
      const surface = this.#surfaces.get(pending.surfaceId);
      if (surface) {
        try {
          const dataModel = applyDataModelUpdate(surface.dataModel, pending.responsePath, value);
          this.#replaceSurface({ ...surface, dataModel });
        } catch (error) {
          pending.reject(error instanceof Error ? error : new Error(String(error)));
          return { ok: false, outbound };
        }
      }
    }
    pending.resolve(value);
    return { ok: true, outbound };
  }

  #replaceSurface(surface: Omit<SurfaceSnapshot, "revision"> & { revision?: number }): void {
    this.#revision += 1;
    this.#surfaces.set(surface.surfaceId, { ...surface, revision: this.#revision });
    this.#notify();
  }

  #mergeComponents(
    existing: string,
    components: string[],
  ): Pick<SurfaceSnapshot, "source" | "parseResult" | "errors"> {
    const source = mergeComponentStatements(existing, components);
    const parseResult = this.#parser.parse(source);
    return {
      source,
      parseResult,
      errors: parseResult.meta.errors.map(parseError),
    };
  }

  #invalidMessage(
    input: unknown,
    issues: ProtocolValidationIssue[],
    outbound: RendererToAgentMessage[],
  ): ProcessResult {
    const target = validationTarget(input);
    const issue = issues[0] ?? { path: "/", message: "Invalid A2UI message" };
    if (target.surfaceId !== undefined) {
      this.#emitValidationError(target.surfaceId, issue.path, issue.message);
      return { ok: false, outbound, issues };
    }
    if (target.functionCallId !== undefined) {
      this.#emitGenericError(
        "INVALID_MESSAGE",
        `${issue.path}: ${issue.message}`,
        undefined,
        target.functionCallId,
      );
      return { ok: false, outbound, issues };
    }
    return { ok: false, outbound, issues };
  }

  #requireSurface(surfaceId: string): SurfaceSnapshot | undefined {
    const surface = this.#surfaces.get(surfaceId);
    if (!surface) {
      this.#emitGenericError("SURFACE_NOT_FOUND", `Unknown surface: ${surfaceId}`, surfaceId);
    }
    return surface;
  }

  #emitValidationError(surfaceId: string, path: string, message: string): void {
    const error: ValidationFailedErrorMessage = {
      version: "v1.0",
      error: { code: "VALIDATION_FAILED", surfaceId, path, message },
    };
    this.#emit(error);
  }

  #emitGenericError(
    code: string,
    message: string,
    surfaceId?: string,
    functionCallId?: string,
  ): void {
    if (surfaceId === undefined && functionCallId === undefined) return;
    const error: GenericErrorMessage =
      surfaceId !== undefined
        ? { version: "v1.0", error: { code, message, surfaceId } }
        : { version: "v1.0", error: { code, message, functionCallId: functionCallId! } };
    this.#emit(error);
  }

  #emit(message: RendererToAgentMessage): void {
    const metadata = this.getRendererMetadata();
    this.#onMessage?.(message, metadata);
    for (const listener of this.#messageListeners) listener(message, metadata);
  }

  #notify(): void {
    for (const listener of this.#surfaceListeners) listener();
  }
}

export function createA2UIClient(options: A2UIClientOptions): A2UIClient {
  return new A2UIClient(options);
}
