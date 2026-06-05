"use client";

import MuiCard from "@mui/material/Card";
import MuiCardContent from "@mui/material/CardContent";
import MuiCardHeader from "@mui/material/CardHeader";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

export const Card = defineComponent({
  name: "Card",
  props: z.object({ children: z.array(z.any()) }),
  description: "A container with title, description, and content sections",
  component: ({ props, renderNode }) => (
    <MuiCard variant="outlined" sx={{ mb: 1 }}>
      <MuiCardContent>{renderNode(props.children)}</MuiCardContent>
    </MuiCard>
  ),
});

export const CardHeader = defineComponent({
  name: "CardHeader",
  props: z.object({ title: z.string(), description: z.string().optional() }),
  description: "Title and description header for a card",
  component: ({ props }) => (
    <MuiCardHeader
      title={props.title as string}
      subheader={(props.description as string) ?? undefined}
      sx={{ px: 0, pt: 0 }}
    />
  ),
});
