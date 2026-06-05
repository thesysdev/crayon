"use client";

import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Switch from "@mui/material/Switch";
import { defineComponent } from "@openuidev/react-lang";
import { useState } from "react";
import { z } from "zod";

export const SwitchGroup = defineComponent({
  name: "SwitchGroup",
  props: z.object({ children: z.array(z.any()) }),
  description: "Group of toggle switches",
  component: ({ props, renderNode }) => <FormGroup>{renderNode(props.children)}</FormGroup>,
});

export const SwitchItem = defineComponent({
  name: "SwitchItem",
  props: z.object({ label: z.string() }),
  description: "A single toggle switch",
  component: ({ props }) => {
    const [checked, setChecked] = useState(false);
    return (
      <FormControlLabel
        control={<Switch checked={checked} onChange={(_, v) => setChecked(v)} />}
        label={props.label as string}
      />
    );
  },
});
