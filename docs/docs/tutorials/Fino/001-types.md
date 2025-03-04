# Interface definitions

Before you begin writing this [code](https://github.com/thesysdev/examples/tree/main/fino-crayon), define the interface for backend-to-UI communication. Unlike traditional setups that use OpenAPI specifications or GraphQL schemas, a conversational system involves a single request and response cycle.

Therefore, you need to define request and response types in a structured way that is easy to use in the frontend and can be easily converted into JSON Schema for integration with an LLM. To do this, define response schemas using TypeScript and Zod. This ensures type safety and facilitates JSON Schema conversion.

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
In the `BreakdownExpensesSummary` Schema, `expenses` contains expense categories and corresponding amounts. `total_spent` represents the total amount spent. For the templates registry, the `templates` array is used to manage different response types by mapping response schemas to named templates.

`TemplatesJsonSchema` is used to integrate structured and fallback responses to ensure consistency in response handling. Once the schemas are set up, the frontend can read and display responses automatically.
