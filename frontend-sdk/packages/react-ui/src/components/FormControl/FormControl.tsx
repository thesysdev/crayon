import clsx from "clsx";
import React, { forwardRef } from "react";
import "./formControl.scss";

interface FormControlProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const FormControl = forwardRef<HTMLDivElement, FormControlProps>((props, ref) => {
  return (
    <div ref={ref} className={clsx("crayon-form-control", props.className)} style={props.style}>
      {props.children}
    </div>
  );
});

FormControl.displayName = "FormControl";

export default FormControl;
