import clsx from "clsx";
import React from "react";
import "./textArea.scss";

export interface TextAreaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  className?: string;
  styles?: React.CSSProperties;
  placeholder?: string;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>((props, ref) => {
  const { className, styles, size = "medium", disabled, ...rest } = props;

  return (
    <div
      className={clsx(
        "crayon-textarea-container",
        `crayon-textarea-container-${size}`,

        {
          "crayon-textarea-container-disabled": disabled,
        },
        className,
      )}
      style={styles}
    >
      <textarea ref={ref} className="crayon-textarea" {...rest} disabled={disabled} />
    </div>
  );
});

TextArea.displayName = "TextArea";

export { TextArea };
