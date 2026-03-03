import { z } from "zod";

export const TextCalloutSchema = z.object({
  variant: z.enum(["neutral", "info", "warning", "success", "danger"]).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});
