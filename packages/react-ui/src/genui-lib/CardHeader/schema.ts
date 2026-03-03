import { z } from "zod";

export const CardHeaderSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
});
