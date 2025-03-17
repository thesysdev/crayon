// JSON schema for a simple text based reponse.
// This should be used as the default/fallback response type when
// using structured outputs.
export const TextResponseSchema = {
  type: "object",
  properties: {
    type: { const: "text" },
    description: "Use this as a fallback when no other response template is applicable",
    text: {
      type: "string",
      description: "plaintext message to be displayed to the user",
    },
  },
  required: ["type", "text"],
  additionalProperties: false,
};
