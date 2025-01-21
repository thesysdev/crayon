import clsx from "clsx";
import React from "react";

export interface TextAreaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  className?: string;
  styles?: React.CSSProperties;
  placeholder?: string;
  rows?: number;
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>((props, ref) => {
  const { className, styles, rows = 3, ...rest } = props;

  return (
    <textarea
      ref={ref}
      className={clsx("crayon-textarea", className)}
      style={styles}
      {...rest}
      rows={rows}
    />
  );
});

TextArea.displayName = "TextArea";

export { TextArea };
