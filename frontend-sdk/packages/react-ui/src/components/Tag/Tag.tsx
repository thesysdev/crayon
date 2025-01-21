import clsx from "clsx";
import React from "react";

export interface TagProps {
  className?: string;
  styles?: React.CSSProperties;
  icon?: React.ReactNode;
  text: React.ReactNode;
}

export const Tag = (props: TagProps) => {
  return (
    <div className={clsx("crayon-tag", props.className)} style={props.styles}>
      {props.icon && <span className="crayon-tag-icon">{props.icon}</span>}
      <span className="crayon-tag-text">{props.text}</span>
    </div>
  );
};

Tag.displayName = "Tag";
