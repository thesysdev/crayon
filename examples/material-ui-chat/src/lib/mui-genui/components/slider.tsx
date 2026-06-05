"use client";

import MuiSlider from "@mui/material/Slider";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

export const Slider = defineComponent({
  name: "Slider",
  props: z.object({
    name: z.string(),
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().optional(),
    defaultValue: z.number().optional(),
  }),
  description: "Range slider",
  component: ({ props }) => (
    <MuiSlider
      name={props.name as string}
      min={(props.min as number) ?? 0}
      max={(props.max as number) ?? 100}
      step={(props.step as number) ?? 1}
      defaultValue={(props.defaultValue as number) ?? 50}
      valueLabelDisplay="auto"
    />
  ),
});
