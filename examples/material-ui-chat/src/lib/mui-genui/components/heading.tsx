"use client";

import Typography from "@mui/material/Typography";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const HeadingSchema = z.object({
  text: z.string(),
  level: z.enum(["h1", "h2", "h3", "h4"]).optional(),
});

export const Heading = defineComponent({
  name: "Heading",
  props: HeadingSchema,
  description: 'Section heading. level: "h1" | "h2" | "h3" | "h4".',
  component: ({ props }) => {
    const level = props.level ?? "h2";
    return (
      <Typography variant={level} component={level} gutterBottom>
        {props.text}
      </Typography>
    );
  },
});
