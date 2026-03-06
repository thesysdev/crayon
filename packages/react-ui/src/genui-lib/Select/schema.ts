import { z } from "zod";

export const SelectItemSchema = z.object({
  value: z.string(),
  label: z.string(),
});
