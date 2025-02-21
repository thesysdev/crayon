# Interface definitions

Before we begin writing any code, we'd need to setup the interface for our backend to UI communication.
communication.
In a traditional setup this would be defined via an OpenAPI spec or GraphQL schema but
since in an conversational setup there'd only be a single request and response, we'd need to define the
request and response types in a way that's easy to use in the frontend and can be be easily converted
to JSON Schema so that we can pass it to an LLM.

```typescript title="src/types/reponseTemplates/templates.ts"
export const BreakdownExpensesSummarySchema = z.object({
  expenses: z.array(
    z.object({
      category: z.string(),
      amount: z.number(),
    })
  ),
  total_spent: z.number(),
});

export type BreakdownExpensesSummaryProps = z.infer<typeof BreakdownExpensesSummarySchema>;

export const templates = [
  {
    name: "breakdown_expenses",
    description: "Renders a summary of the user's financial situation.",
    parameters: BreakdownExpensesSummarySchema,
  },
];

export const TemplatesJsonSchema = {
  type: "object",
  properties: {
    response: {
      type: "array",
      items: {
        oneOf: [
          TextResponseSchema, // A simple text response for when no template is needed
          ...templates.map((template) => ({
            type: "object",
            description: template.description,
            properties: {
              type: { const: "template" },
              name: { const: template.name },
              templateProps: zodToJsonSchema(template.parameters),
            },
            required: ["name", "templateProps", "type"],
            additionalProperties: false,
          })),
        ],
      },
    },
  },
} as const;
```
