import clsx from "clsx";
import { CSSProperties, forwardRef, ReactElement } from "react";
import { ListItemProps } from "../ListItem";

export interface ListBlockProps {
  children: ReactElement<ListItemProps> | ReactElement<ListItemProps>[];
  className?: string;
  style?: CSSProperties;
}

const ListBlock = forwardRef<HTMLDivElement, ListBlockProps>((props, ref) => {
  return (
    <div ref={ref} className={clsx("crayon-list-block", props.className)} style={props.style}>
      {props.children}
    </div>
  );
});

ListBlock.displayName = "ListBlock";

export { ListBlock };
