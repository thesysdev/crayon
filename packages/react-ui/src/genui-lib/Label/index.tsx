"use client";

import { defineComponent } from "@openuidev/lang-react";
import { Label as OpenUILabel } from "../../components/Label";
import { LabelSchema } from "./schema";

export { LabelSchema } from "./schema";

export const Label = defineComponent({
  name: "Label",
  props: LabelSchema,
  description: "Text label",
  component: ({ props }) => <OpenUILabel>{props.text as string}</OpenUILabel>,
});
