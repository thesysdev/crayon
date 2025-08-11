import clsx from "clsx";
import React, { forwardRef } from "react";
import { useFormControlContext } from "../FormControl/context";

export interface TextAreaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  className?: string;
  placeholder?: string;
  rows?: number;
  isError?: boolean;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>((props, ref) => {
  const { className, rows = 3, isError, ...rest } = props;
  const ctx = useFormControlContext();
  const resolvedIsError = isError ?? ctx?.isError ?? false;

  return (
    <textarea
      ref={ref}
      className={clsx("crayon-textarea", className, {
        "crayon-textarea-error": resolvedIsError,
      })}
      {...rest}
      rows={rows}
    />
  );
});

TextArea.displayName = "TextArea";

export { TextArea };
