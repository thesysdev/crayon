# Chat Endpoint

## System Prompt
Add a system prompt to the assistant that will help it answer questions about the user's personal finance history.

```typescript title="src/api/chat/route.ts"
const SYSTEM_MESSAGE: ChatCompletionMessageParam = {
  role: "system",
  content:
    "You are Fino, an AI financial advisor. " +
    "You help users understand their finances, analyze transactions, and provide personalized financial advice. " +
    "Be concise, professional, and focus on providing actionable insights. " +
    "IMPORTANT: Your response must ALWAYS follow this structure:\n" +
    "1. Start with an explanatory text string in the response array\n" +
    "2. Follow with the appropriate template object\n" +
    "3. End with additional insights or recommendations as text string\n" +
    "You have access to tools to analyze transaction data. " +
    "Use these tools when appropriate to provide data-driven insights. " +
    "Always respond with a single JSON object containing a 'response' array which contains text or template object " +
    "Example response structure:\n" +
    '{"response": [\n' +
    '  {"name": "breakdown_expenses", "templateProps": {...},\n' +
    '  "Based on this breakdown, your highest spending is in Food category. Consider setting a budget to reduce these expenses."\n' +
    "]}\n"
};
```

## Add data execution tool
Add a SQL execution tool to the assistant that will allow it to analyze the user's personal finance history.

```typescript title="src/api/chat/route.ts"
import { z } from "zod";

export const SQLArgsSchema = z.object({
  query: z
    .string()
    .describe(
      "SQL query to execute on the Transaction table. Use the Transaction table. " +
        "quote the table name. "
    ),
  description: z
    .string()
    .describe(
      "Human readable description of the intent of this tool call to be shown to the user. Do not include any sensitive information or PII. Construct the sentence in present participle tense."
    ),
});

type SQLArgs = z.infer<typeof SQLArgsSchema>;

export async function execute_sql(args: SQLArgs): Promise<string> {
  const result = await prisma.$queryRawUnsafe(args.query);
  return JSON.stringify(result);
}
```

## Connecting the LLM

We pass the tools along with the templates to OpenAI.
Tools are functions that the LLM can call to get data whereas templates
represent the possible responses that the LLM can return along with their parameters.

Templates are defined in the `templates.ts` file and are passed to OpenAI as a JSON Schema
by using the `response_format` option. This way the LLM can choose the appropriate template
to use based on the user's query.

```typescript title="src/api/chat/route.ts"
import { TemplatesJsonSchema } from "@/types/reponseTemplates/templates";

const completion = openai.beta.chat.completions.runTools({
    model: "gpt-4o",
    messages: [SYSTEM_MESSAGE, ...historicalMessages, userMessage],
    temperature: 0.5,
    max_tokens: 1000,
    stream: true,
    tools: [
      {
        type: "function",
        function: {
          function: execute_sql,
          description:
            "Execute SQL lite queries on the Transaction table. \n" +
            `id              Int      @id @default(autoincrement())
              date            DateTime
              amount          Float
              balance         Float
              category        String
              transaction_type "credit" | "debit"`
              .split("\n")
              .map((line) => line.trim())
              .join("\n"),
          parameters: zodToJsonSchema(SQLArgsSchema) as object,
          parse: (params: string) => {
            return SQLArgsSchema.parse(JSON.parse(params));
          },
          strict: true,
        },
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "json_schema",
        schema: TemplatesJsonSchema,
      },
    },
  });
```
