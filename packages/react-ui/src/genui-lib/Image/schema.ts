import { z } from "zod";

export const ImageSchema = z.object({
  alt: z.string(),
  src: z.string().optional(),
});
