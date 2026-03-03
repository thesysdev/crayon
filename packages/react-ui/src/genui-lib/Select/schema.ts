import { z } from "zod";

type RefComponent = { ref: z.ZodTypeAny };

export const SelectItemSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export function createSelectSchema(SelectItem: RefComponent) {
  return z.object({
    name: z.string(),
    items: z.array(SelectItem.ref),
    placeholder: z.string().optional(),
    rules: z.array(z.string()).optional(),
  });
}
