"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

export const ImageComponent = defineComponent({
  name: "Image",
  props: z.object({ src: z.string(), alt: z.string().optional() }),
  description: "An inline image",
  component: ({ props }) => (
    <Box
      component="img"
      src={props.src as string}
      alt={(props.alt as string) ?? ""}
      sx={{ maxWidth: "100%", height: "auto", borderRadius: 1 }}
    />
  ),
});

export const ImageBlock = defineComponent({
  name: "ImageBlock",
  props: z.object({ src: z.string(), caption: z.string().optional() }),
  description: "Image with caption",
  component: ({ props }) => (
    <Box sx={{ my: 1 }}>
      <Box
        component="img"
        src={props.src as string}
        alt={(props.caption as string) ?? ""}
        sx={{ maxWidth: "100%", height: "auto", borderRadius: 1 }}
      />
      {props.caption && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          {props.caption as string}
        </Typography>
      )}
    </Box>
  ),
});
