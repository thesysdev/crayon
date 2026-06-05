"use client";

import LinearProgress from "@mui/material/LinearProgress";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

export const Progress = defineComponent({
  name: "Progress",
  props: z.object({ value: z.number().optional() }),
  description: "Progress bar indicator",
  component: ({ props }) => {
    const value = props.value as number | undefined;
    return value != null ? (
      <LinearProgress variant="determinate" value={Math.min(100, Math.max(0, value))} />
    ) : (
      <LinearProgress />
    );
  },
});
