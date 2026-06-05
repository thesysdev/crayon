"use client";

import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Radio from "@mui/material/Radio";
import MuiRadioGroup from "@mui/material/RadioGroup";
import { defineComponent } from "@openuidev/react-lang";
import { useState } from "react";
import { z } from "zod";

export const RadioGroup = defineComponent({
  name: "RadioGroup",
  props: z.object({ label: z.string().optional(), children: z.array(z.any()) }),
  description: "Group of radio button options",
  component: ({ props, renderNode }) => {
    const [value, setValue] = useState("");
    return (
      <FormControl>
        {props.label && <FormLabel>{props.label as string}</FormLabel>}
        <MuiRadioGroup value={value} onChange={(_, v) => setValue(v)}>
          {renderNode(props.children)}
        </MuiRadioGroup>
      </FormControl>
    );
  },
});

export const RadioItem = defineComponent({
  name: "RadioItem",
  props: z.object({ value: z.string(), label: z.string() }),
  description: "A single radio option",
  component: ({ props }) => (
    <FormControlLabel
      value={props.value as string}
      control={<Radio />}
      label={props.label as string}
    />
  ),
});
