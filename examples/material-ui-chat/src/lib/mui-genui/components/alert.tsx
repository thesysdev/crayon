"use client";

import MuiAlert from "@mui/material/Alert";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const severityMap: Record<string, "info" | "success" | "warning" | "error"> = {
  info: "info",
  success: "success",
  warning: "warning",
  error: "error",
};

export const Alert = defineComponent({
  name: "Alert",
  props: z.object({
    severity: z.enum(["info", "success", "warning", "error"]).optional(),
    message: z.string(),
  }),
  description: "Alert banner for info, success, warning, or error",
  component: ({ props }) => (
    <MuiAlert severity={severityMap[(props.severity as string) ?? "info"] ?? "info"}>
      {props.message as string}
    </MuiAlert>
  ),
});
