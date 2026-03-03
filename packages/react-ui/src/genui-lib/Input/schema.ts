import { z } from "zod";

const validationRules = z.array(z.string()).optional();

export const InputSchema = z.object({
  name: z.string(),
  placeholder: z.string().optional(),
  type: z.enum(["text", "email", "password", "number", "url"]).optional(),
  rules: validationRules,
});
