import clsx from "clsx";
import React from "react";
import { ListItemProps } from "../ListItem";

export interface ListBlockProps {
  children: React.ReactElement<ListItemProps> | React.ReactElement<ListItemProps>[];
  className?: string;
  style?: React.CSSProperties;
}

const ListBlock = (props: ListBlockProps) => {
  return (
    <div className={clsx("crayon-list-block", props.className)} style={props.style}>
      {props.children}
    </div>
  );
};

export { ListBlock };
