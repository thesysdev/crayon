import { z } from "zod";

export const ButtonSchema = z.object({
  label: z.string(),
  action: z.string(),
  variant: z.enum(["primary", "secondary", "tertiary"]).optional(),
  type: z.enum(["normal", "destructive"]).optional(),
  size: z.enum(["extra-small", "small", "medium", "large"]).optional(),
});
