"use client";

import MuiFormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

export const FormControl = defineComponent({
  name: "FormControl",
  props: z.object({
    label: z.string(),
    children: z.array(z.any()),
    helpText: z.string().optional(),
  }),
  description: "A labeled form field wrapper",
  component: ({ props, renderNode }) => (
    <MuiFormControl fullWidth variant="outlined">
      <FormLabel>{props.label as string}</FormLabel>
      {renderNode(props.children)}
      {props.helpText && <FormHelperText>{props.helpText as string}</FormHelperText>}
    </MuiFormControl>
  ),
});
