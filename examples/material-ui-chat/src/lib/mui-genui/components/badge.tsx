"use client";

import Chip from "@mui/material/Chip";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const colorMap: Record<
  string,
  "default" | "primary" | "secondary" | "success" | "warning" | "error" | "info"
> = {
  default: "default",
  primary: "primary",
  secondary: "secondary",
  success: "success",
  warning: "warning",
  error: "error",
};

export const Badge = defineComponent({
  name: "Badge",
  props: z.object({ label: z.string(), color: z.string().optional() }),
  description: "A small badge/tag label",
  component: ({ props }) => {
    const color = colorMap[(props.color as string) ?? "default"] ?? "default";
    return <Chip label={props.label as string} color={color} size="small" />;
  },
});
