import { z } from "zod";

const ImageItemSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
  details: z.string().optional(),
});

export const ImageGallerySchema = z.object({
  images: z.array(ImageItemSchema),
});
