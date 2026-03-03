import { z } from "zod";

export const LabelSchema = z.object({
  text: z.string(),
});
