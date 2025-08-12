import clsx from "clsx";
import React, { forwardRef } from "react";
import { useFormControlContext } from "../FormControl/context";

export interface TextAreaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  className?: string;
  placeholder?: string;
  rows?: number;
  hasError?: boolean;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>((props, ref) => {
  const { className, rows = 3, hasError, ...rest } = props;
  const ctx = useFormControlContext();
  const resolvedHasError = hasError ?? ctx?.hasError ?? false;

  return (
    <textarea
      ref={ref}
      className={clsx("crayon-textarea", className, {
        "crayon-textarea-error": resolvedHasError,
      })}
      {...rest}
      rows={rows}
    />
  );
});

TextArea.displayName = "TextArea";

export { TextArea };
