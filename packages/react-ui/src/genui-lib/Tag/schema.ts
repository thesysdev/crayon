import { z } from "zod";

export const TagSchema = z.object({
  text: z.string(),
  icon: z.string().optional(),
  size: z.enum(["sm", "md", "lg"]).optional(),
  variant: z.enum(["neutral", "info", "success", "warning", "danger"]).optional(),
});
