"use client";

import Divider from "@mui/material/Divider";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

export const Separator = defineComponent({
  name: "Separator",
  props: z.object({}),
  description: "A horizontal divider line",
  component: () => <Divider sx={{ my: 1 }} />,
});
