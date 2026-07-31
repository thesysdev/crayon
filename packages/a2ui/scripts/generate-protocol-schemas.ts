import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { z } from "zod/v4";

import {
  agentCapabilitiesSchema,
  agentToRendererMessageSchema,
  rendererCapabilitiesSchema,
  rendererDataModelSchema,
  rendererToAgentMessageSchema,
} from "../src/protocol-schema";

const packageDirectory = join(dirname(fileURLToPath(import.meta.url)), "..");
const checkOnly = process.argv.includes("--check");

interface SchemaDocument {
  file: string;
  id: string;
  title: string;
  description?: string;
  schema: z.ZodType;
}

const schemaDocuments: SchemaDocument[] = [
  {
    file: "agent-to-renderer.json",
    id: "https://openui.com/schema/a2ui/v1.0/agent-to-renderer.json",
    title: "A2UI v1.0 with OpenUI Lang component updates",
    description:
      "The A2UI v1.0 agent-to-renderer envelope with component lists represented as OpenUI Lang statement strings.",
    schema: agentToRendererMessageSchema,
  },
  {
    file: "renderer-to-agent.json",
    id: "https://openui.com/schema/a2ui/v1.0/renderer-to-agent.json",
    title: "A2UI v1.0 renderer-to-agent messages",
    schema: rendererToAgentMessageSchema,
  },
  {
    file: "renderer-capabilities.json",
    id: "https://openui.com/schema/a2ui/v1.0/renderer-capabilities.json",
    title: "A2UI v1.0 renderer capabilities",
    schema: rendererCapabilitiesSchema,
  },
  {
    file: "agent-capabilities.json",
    id: "https://openui.com/schema/a2ui/v1.0/agent-capabilities.json",
    title: "A2UI v1.0 agent capabilities",
    schema: agentCapabilitiesSchema,
  },
  {
    file: "renderer-data-model.json",
    id: "https://openui.com/schema/a2ui/v1.0/renderer-data-model.json",
    title: "A2UI v1.0 renderer data model",
    schema: rendererDataModelSchema,
  },
];

function generateDocument(definition: SchemaDocument): string {
  const generated = z.toJSONSchema(definition.schema) as Record<string, unknown>;
  const { $schema, anyOf, ...body } = generated;
  const document = {
    $schema,
    $id: definition.id,
    title: definition.title,
    ...(definition.description ? { description: definition.description } : {}),
    ...body,
    ...(Array.isArray(anyOf) ? { type: "object", oneOf: anyOf } : {}),
  };

  return `${JSON.stringify(document, null, 2)}\n`;
}

const staleFiles: string[] = [];

for (const definition of schemaDocuments) {
  const path = join(packageDirectory, "schema", definition.file);
  const generated = generateDocument(definition);

  if (checkOnly) {
    const committed = await readFile(path, "utf8");
    if (committed !== generated) staleFiles.push(definition.file);
  } else {
    await writeFile(path, generated);
  }
}

if (staleFiles.length > 0) {
  console.error(
    `Generated protocol schemas are stale: ${staleFiles.join(", ")}. Run pnpm schema:generate.`,
  );
  process.exitCode = 1;
}
