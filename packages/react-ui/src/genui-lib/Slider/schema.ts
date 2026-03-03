import { z } from "zod";

const validationRules = z.array(z.string()).optional();

export const SliderSchema = z.object({
  name: z.string(),
  variant: z.enum(["continuous", "discrete"]),
  min: z.number(),
  max: z.number(),
  step: z.number().optional(),
  defaultValue: z.number().optional(),
  rules: validationRules,
});
