import clsx from "clsx";
import { CSSProperties, forwardRef, ReactNode } from "react";

export interface TagProps {
  className?: string;
  styles?: CSSProperties;
  icon?: ReactNode;
  text: ReactNode;
}

export const Tag = forwardRef<HTMLDivElement, TagProps>((props, ref) => {
  return (
    <div ref={ref} className={clsx("crayon-tag", props.className)} style={props.styles}>
      {props.icon && <span className="crayon-tag-icon">{props.icon}</span>}
      <span className="crayon-tag-text">{props.text}</span>
    </div>
  );
});

Tag.displayName = "Tag";
