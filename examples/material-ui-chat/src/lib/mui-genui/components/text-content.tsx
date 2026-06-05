"use client";

import Typography from "@mui/material/Typography";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const sizeMap: Record<string, "body2" | "body1" | "h6" | "subtitle2" | "h5"> = {
  small: "body2",
  default: "body1",
  large: "h6",
  "small-heavy": "subtitle2",
  "large-heavy": "h5",
};

export const TextContent = defineComponent({
  name: "TextContent",
  props: z.object({ text: z.string(), size: z.string().optional() }),
  description: "Displays text content with optional size variants",
  component: ({ props }) => {
    const variant = sizeMap[(props.size as string) ?? "default"] ?? "body1";
    return <Typography variant={variant}>{String(props.text ?? "")}</Typography>;
  },
});
