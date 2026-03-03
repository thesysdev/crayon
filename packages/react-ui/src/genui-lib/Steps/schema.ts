import { z } from "zod";

export const StepsItemSchema = z.object({
  title: z.string(),
  details: z.string(),
});
