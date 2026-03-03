import { z } from "zod";

const validationRules = z.array(z.string()).optional();

export const DatePickerSchema = z.object({
  name: z.string(),
  mode: z.enum(["single", "range"]),
  rules: validationRules,
});
