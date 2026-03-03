"use client";

import { defineComponent } from "@openuidev/lang-react";
import { ImageBlock as OpenUIImageBlock } from "../../components/ImageBlock";
import { ImageBlockSchema } from "./schema";

export { ImageBlockSchema } from "./schema";

export const ImageBlock = defineComponent({
  name: "ImageBlock",
  props: ImageBlockSchema,
  description: "Image block with loading state",
  component: ({ props }) => (
    <OpenUIImageBlock src={props.src as string} alt={props.alt as string | undefined} />
  ),
});
