"use client";

import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import MuiSelect from "@mui/material/Select";
import { defineComponent, useStateField } from "@openuidev/react-lang";
import { z } from "zod";

export const Select = defineComponent({
  name: "Select",
  props: z.object({
    name: z.string(),
    placeholder: z.string().optional(),
    children: z.array(z.any()),
  }),
  description: "Dropdown select with items",
  component: ({ props, renderNode }) => {
    const field = useStateField(props.name, "");
    return (
      <FormControl size="small" fullWidth>
        <MuiSelect
          value={field.value ?? ""}
          onChange={(e) => field.setValue(e.target.value)}
          displayEmpty
        >
          {props.placeholder && (
            <MenuItem value="" disabled>
              {props.placeholder as string}
            </MenuItem>
          )}
          {renderNode(props.children)}
        </MuiSelect>
      </FormControl>
    );
  },
});

export const SelectItem = defineComponent({
  name: "SelectItem",
  props: z.object({ value: z.string(), label: z.string() }),
  description: "An option within a Select dropdown",
  component: ({ props }) => (
    <MenuItem value={props.value as string}>{props.label as string}</MenuItem>
  ),
});
