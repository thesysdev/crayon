import { defineComponent } from "@openuidev/lang-react";
import { z } from "zod";

export const SliceSchema = z.object({
  category: z.string(),
  value: z.number(),
});

export const Slice = defineComponent({
  name: "Slice",
  props: SliceSchema,
  description: "One slice with label and numeric value",
  component: () => null,
});
