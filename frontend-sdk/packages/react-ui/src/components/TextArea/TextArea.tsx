import clsx from "clsx";
import React, { forwardRef } from "react";

export interface TextAreaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  className?: string;
  placeholder?: string;
  rows?: number;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>((props, ref) => {
  const { className, rows = 3, ...rest } = props;

  return (
    <textarea ref={ref} className={clsx("crayon-textarea", className)} {...rest} rows={rows} />
  );
});

TextArea.displayName = "TextArea";

export { TextArea };
