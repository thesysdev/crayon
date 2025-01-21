import React from "react";
import "./textArea.scss";

export interface TextAreaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  className?: string;
  styles?: React.CSSProperties;
  placeholder?: string;
  size?: "small" | "medium" | "large";
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>((props, ref) => {
  const { className, styles, size = "medium", ...rest } = props;

  return <textarea ref={ref} className="crayon-textarea" {...rest} />;
});

TextArea.displayName = "TextArea";

export { TextArea };
