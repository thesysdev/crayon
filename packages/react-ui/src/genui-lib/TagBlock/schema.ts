import { z } from "zod";

export const TagBlockSchema = z.object({
  tags: z.array(z.string()),
});
