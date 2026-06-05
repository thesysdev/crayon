"use client";

import Box from "@mui/material/Box";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

export const Form = defineComponent({
  name: "Form",
  props: z.object({
    name: z.string(),
    children: z.array(z.any()),
  }),
  description: "Form container that holds form controls",
  component: ({ props, renderNode }) => (
    <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 2, my: 1 }}>
      {renderNode(props.children)}
    </Box>
  ),
});
