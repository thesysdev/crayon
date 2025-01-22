import clsx from "clsx";
import React from "react";
import { ListItemProps } from "../ListItem";

interface ListProps {
  children: React.ReactElement<ListItemProps> | React.ReactElement<ListItemProps>[];
  className?: string;
  style?: React.CSSProperties;
}

const List = (props: ListProps) => {
  return (
    <div className={clsx("crayon-list", props.className)} style={props.style}>
      {props.children}
    </div>
  );
};

export default List;
