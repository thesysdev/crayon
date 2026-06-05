"use client";

import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import { defineComponent } from "@openuidev/react-lang";
import { useState } from "react";
import { z } from "zod";

export const CheckBoxGroup = defineComponent({
  name: "CheckBoxGroup",
  props: z.object({ children: z.array(z.any()) }),
  description: "Group of checkbox options",
  component: ({ props, renderNode }) => <FormGroup>{renderNode(props.children)}</FormGroup>,
});

export const CheckBoxItem = defineComponent({
  name: "CheckBoxItem",
  props: z.object({ label: z.string(), value: z.string() }),
  description: "A single checkbox option",
  component: ({ props }) => {
    const [checked, setChecked] = useState(false);
    return (
      <FormControlLabel
        control={<Checkbox checked={checked} onChange={(_, v) => setChecked(v)} />}
        label={props.label as string}
      />
    );
  },
});
