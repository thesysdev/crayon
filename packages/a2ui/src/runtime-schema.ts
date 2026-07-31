import { z } from "zod/v4";
import type { AgentToRendererMessage, ProtocolValidationIssue } from "./types";

const jsonValue = z.json();
const jsonObject = z.record(z.string(), jsonValue);
const version = z.literal("v1.0");
const surfaceId = z.string().min(1);
const langComponents = z.array(z.string().min(1)).min(1);

const createSurfaceMessageSchema = z.strictObject({
  version,
  createSurface: z.strictObject({
    surfaceId,
    catalogId: z.string().min(1).optional(),
    surfaceProperties: jsonObject.optional(),
    sendDataModel: z.boolean().optional(),
    components: langComponents.optional(),
    dataModel: jsonObject.optional(),
  }),
});

const updateComponentsMessageSchema = z.strictObject({
  version,
  updateComponents: z.strictObject({
    surfaceId,
    components: langComponents,
  }),
});

const updateDataModelMessageSchema = z.strictObject({
  version,
  updateDataModel: z.strictObject({
    surfaceId,
    path: z.string().optional(),
    value: jsonValue,
  }),
});

const deleteSurfaceMessageSchema = z.strictObject({
  version,
  deleteSurface: z.strictObject({ surfaceId }),
});

const callFunctionMessageSchema = z.strictObject({
  version,
  functionCallId: z.string().min(1),
  wantResponse: z.boolean().optional(),
  callFunction: z.strictObject({
    call: z.string().min(1),
    args: jsonObject.optional(),
  }),
});

const actionResponseMessageSchema = z.strictObject({
  version,
  actionId: z.string().min(1),
  actionResponse: z.union([
    z.strictObject({ value: jsonValue }),
    z.strictObject({
      error: z.strictObject({ code: z.string().min(1), message: z.string() }),
    }),
  ]),
});

export const agentToRendererMessageSchema = z.union([
  createSurfaceMessageSchema,
  updateComponentsMessageSchema,
  updateDataModelMessageSchema,
  deleteSurfaceMessageSchema,
  callFunctionMessageSchema,
  actionResponseMessageSchema,
]);

function escapePointerToken(token: PropertyKey): string {
  return String(token).replace(/~/g, "~0").replace(/\//g, "~1");
}

function issuePath(path: PropertyKey[]): string {
  return path.length === 0 ? "/" : `/${path.map(escapePointerToken).join("/")}`;
}

export function validateAgentToRendererMessage(
  input: unknown,
):
  | { success: true; message: AgentToRendererMessage }
  | { success: false; issues: ProtocolValidationIssue[] } {
  const object =
    input != null && typeof input === "object" && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : undefined;
  const messageKeys = [
    "createSurface",
    "updateComponents",
    "updateDataModel",
    "deleteSurface",
    "callFunction",
    "actionResponse",
  ] as const;
  const presentKeys = object
    ? messageKeys.filter((key) => Object.prototype.hasOwnProperty.call(object, key))
    : [];
  const selectedSchema =
    presentKeys.length === 1
      ? {
          createSurface: createSurfaceMessageSchema,
          updateComponents: updateComponentsMessageSchema,
          updateDataModel: updateDataModelMessageSchema,
          deleteSurface: deleteSurfaceMessageSchema,
          callFunction: callFunctionMessageSchema,
          actionResponse: actionResponseMessageSchema,
        }[presentKeys[0]!]
      : agentToRendererMessageSchema;
  const result = selectedSchema.safeParse(input);
  if (result.success) {
    return { success: true, message: result.data as AgentToRendererMessage };
  }
  return {
    success: false,
    issues: result.error.issues.map((issue) => ({
      path: issuePath(issue.path),
      message: issue.message,
    })),
  };
}
