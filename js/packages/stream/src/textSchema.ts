// OpenAPI object definition for a simple text based reponse.
// This should be used as the default/fallback response type when
// using structured outputs.
export const TextResponseSchema = {
  type: "object",
  properties: {
    type: { const: "text" },
    text: {
      type: "string",
      description: "text message to be displayed to the user",
    },
  },
  required: ["type", "text"],
  additionalProperties: false,
};
