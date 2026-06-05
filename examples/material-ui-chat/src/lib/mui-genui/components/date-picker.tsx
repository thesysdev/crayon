"use client";

import TextField from "@mui/material/TextField";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

export const DatePicker = defineComponent({
  name: "DatePicker",
  props: z.object({ name: z.string(), label: z.string().optional() }),
  description: "Date picker control",
  component: ({ props }) => (
    <TextField
      name={props.name as string}
      label={(props.label as string) ?? "Pick a date"}
      type="date"
      size="small"
      InputLabelProps={{ shrink: true }}
      fullWidth
    />
  ),
});
