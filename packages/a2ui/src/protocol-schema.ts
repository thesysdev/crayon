import { z } from "zod/v4";

export const jsonValueSchema = z.json();
export const jsonObjectSchema = z.record(z.string(), jsonValueSchema);

const versionSchema = z.literal("v1.0");
const surfaceIdSchema = z.string();
const langComponentsSchema = z
  .array(z.string().min(1))
  .min(1)
  .describe(
    "Complete OpenUI Lang statements or statement blocks, merged by statement ID in array order.",
  );

export const a2uiFunctionCallSchema = z.strictObject({
  call: z.string(),
  args: jsonObjectSchema.optional(),
});

export const createSurfaceMessageSchema = z.strictObject({
  version: versionSchema,
  createSurface: z.strictObject({
    surfaceId: surfaceIdSchema,
    catalogId: z.string().optional(),
    surfaceProperties: jsonObjectSchema.optional(),
    sendDataModel: z.boolean().optional().meta({ default: false }),
    components: langComponentsSchema
      .optional()
      .describe("Optional initial OpenUI Lang statements for single-message surface creation."),
    dataModel: jsonObjectSchema.optional(),
  }),
});

export const updateComponentsMessageSchema = z.strictObject({
  version: versionSchema,
  updateComponents: z.strictObject({
    surfaceId: surfaceIdSchema,
    components: langComponentsSchema,
  }),
});

export const updateDataModelMessageSchema = z.strictObject({
  version: versionSchema,
  updateDataModel: z.strictObject({
    surfaceId: surfaceIdSchema,
    path: z.string().optional(),
    value: jsonValueSchema,
  }),
});

export const deleteSurfaceMessageSchema = z.strictObject({
  version: versionSchema,
  deleteSurface: z.strictObject({ surfaceId: surfaceIdSchema }),
});

export const callFunctionMessageSchema = z.strictObject({
  version: versionSchema,
  functionCallId: z.string(),
  wantResponse: z.boolean().optional().meta({ default: false }),
  callFunction: a2uiFunctionCallSchema,
});

export const actionResponseMessageSchema = z.strictObject({
  version: versionSchema,
  actionId: z.string(),
  actionResponse: z.union([
    z.strictObject({ value: jsonValueSchema }),
    z.strictObject({
      error: z.strictObject({ code: z.string(), message: z.string() }),
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

export const actionMessageSchema = z.strictObject({
  version: versionSchema,
  action: z.strictObject({
    name: z.string(),
    surfaceId: surfaceIdSchema,
    sourceComponentId: z.string(),
    timestamp: z.iso.datetime({ offset: true }),
    context: jsonObjectSchema,
    wantResponse: z.boolean().optional().meta({ default: false }),
    actionId: z.string().optional(),
  }),
});

export const functionResponseMessageSchema = z.strictObject({
  version: versionSchema,
  functionResponse: z.strictObject({
    functionCallId: z.string(),
    call: z.string(),
    value: jsonValueSchema,
  }),
});

export const validationFailedErrorMessageSchema = z.strictObject({
  version: versionSchema,
  error: z.strictObject({
    code: z.literal("VALIDATION_FAILED"),
    surfaceId: surfaceIdSchema,
    path: z.string(),
    message: z.string(),
  }),
});

const genericErrorCodeSchema = z.string().regex(/^(?!VALIDATION_FAILED$).*$/);

export const genericErrorMessageSchema = z.union([
  z.strictObject({
    version: versionSchema,
    error: z.strictObject({
      code: genericErrorCodeSchema,
      message: z.string(),
      surfaceId: surfaceIdSchema,
    }),
  }),
  z.strictObject({
    version: versionSchema,
    error: z.strictObject({
      code: genericErrorCodeSchema,
      message: z.string(),
      functionCallId: z.string(),
    }),
  }),
]);

export const rendererToAgentMessageSchema = z.union([
  actionMessageSchema,
  functionResponseMessageSchema,
  validationFailedErrorMessageSchema,
  genericErrorMessageSchema,
]);

export const rendererCapabilitiesSchema = z.strictObject({
  "v1.0": z.strictObject({
    supportedCatalogIds: z.array(z.string()),
    inlineCatalogs: z.array(jsonObjectSchema).optional(),
  }),
});

export const agentCapabilitiesSchema = z.strictObject({
  "v1.0": z.strictObject({
    supportedCatalogIds: z.array(z.string()).optional(),
    acceptsInlineCatalogs: z.boolean().optional().meta({ default: false }),
  }),
});

export const rendererDataModelSchema = z.strictObject({
  version: versionSchema,
  surfaces: z.record(z.string(), jsonObjectSchema),
});
