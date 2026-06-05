"use client";

import Stack from "@mui/material/Stack";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

export const Buttons = defineComponent({
  name: "Buttons",
  props: z.object({ children: z.array(z.any()) }),
  description: "Horizontal button row",
  component: ({ props, renderNode }) => (
    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
      {renderNode(props.children)}
    </Stack>
  ),
});
