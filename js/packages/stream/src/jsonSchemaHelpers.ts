import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { TextResponseSchema } from "./textSchema";

export const zodToTemplateSchema = (schema: z.ZodSchema, name: string, description?: string) => {
  return {
    type: "object",
    description: description,
    properties: {
      type: {
        const: "template",
      },
      name: { const: name },
      templateProps: zodToJsonSchema(schema),
    },
    required: ["name", "templateProps", "type"],
    additionalProperties: false,
  };
};

export const templatesToResponseFormat = (
  ...templates: {
    schema: z.ZodSchema;
    name: string;
    description?: string;
  }[]
) => {
  const templatesJsonSchema = {
    type: "object",
    properties: {
      response: {
        type: "array",
        items: {
          oneOf: [
            TextResponseSchema,
            ...templates.map((template) =>
              zodToTemplateSchema(template.schema, template.name, template.description),
            ),
          ],
        },
      },
    },
    required: ["response"],
    additionalProperties: false,
  } as const;
  return {
    type: "json_schema" as const,
    json_schema: {
      name: "json_schema",
      schema: templatesJsonSchema,
    },
  };
};
