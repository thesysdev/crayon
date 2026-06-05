"use client";

import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

export const CodeBlock = defineComponent({
  name: "CodeBlock",
  props: z.object({ code: z.string(), language: z.string().optional() }),
  description: "Formatted code block with syntax highlighting",
  component: ({ props }) => (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        bgcolor: "grey.100",
        fontFamily: "monospace",
        fontSize: "0.875rem",
        overflow: "auto",
        whiteSpace: "pre-wrap",
      }}
    >
      <Typography component="pre" variant="body2" sx={{ fontFamily: "inherit", m: 0 }}>
        {props.code as string}
      </Typography>
    </Paper>
  ),
});
