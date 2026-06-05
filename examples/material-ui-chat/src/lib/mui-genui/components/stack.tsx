"use client";

import MuiStack from "@mui/material/Stack";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

export const Stack = defineComponent({
  name: "Stack",
  props: z.object({
    children: z.array(z.any()),
    direction: z.enum(["row", "column"]).optional(),
    gap: z.number().optional(),
    align: z.string().optional(),
    justify: z.string().optional(),
    wrap: z.boolean().optional(),
  }),
  description: "Vertical layout container for children",
  component: ({ props, renderNode }) => {
    const gap = props.gap as number | undefined;
    return (
      <MuiStack
        direction={(props.direction as "row" | "column") ?? "column"}
        spacing={gap ?? 1}
        alignItems={
          props.align as string as
            | "flex-start"
            | "center"
            | "flex-end"
            | "stretch"
            | "baseline"
            | undefined
        }
        justifyContent={
          props.justify as string as
            | "flex-start"
            | "center"
            | "flex-end"
            | "space-between"
            | "space-around"
            | "space-evenly"
            | undefined
        }
        flexWrap={props.wrap ? "wrap" : undefined}
      >
        {renderNode(props.children)}
      </MuiStack>
    );
  },
});
