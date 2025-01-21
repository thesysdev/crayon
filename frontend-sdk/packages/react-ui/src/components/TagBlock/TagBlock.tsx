import clsx from "clsx";
import React, { forwardRef } from "react";
import { Tag } from "../Tag";

export interface TagBlockProps {
  children: React.ReactElement<typeof Tag> | React.ReactElement<typeof Tag>[];
  styles?: React.CSSProperties;
  className?: string;
}

export const TagBlock = forwardRef<HTMLDivElement, TagBlockProps>((props, ref) => {
  return (
    <div ref={ref} className={clsx("crayon-tag-block", props.className)} style={props.styles}>
      {props.children}
    </div>
  );
});

TagBlock.displayName = "TagBlock";
