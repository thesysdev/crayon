import { z } from "zod";

const validationRules = z.array(z.string()).optional();

export const TextAreaSchema = z.object({
  name: z.string(),
  placeholder: z.string().optional(),
  rows: z.number().optional(),
  rules: validationRules,
});
