import clsx from "clsx";
import { CSSProperties, forwardRef, ReactElement } from "react";
import { Tag } from "../Tag";

export interface TagBlockProps {
  children: ReactElement<typeof Tag> | ReactElement<typeof Tag>[];
  styles?: CSSProperties;
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
