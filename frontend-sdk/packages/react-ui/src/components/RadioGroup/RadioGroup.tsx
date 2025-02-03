import * as Radio from "@radix-ui/react-radio-group";
import clsx from "clsx";
import { forwardRef } from "react";
import { RadioItemProps } from "../RadioItem";

interface RadioGroupProps extends Radio.RadioGroupProps {
  children: React.ReactElement<RadioItemProps> | React.ReactElement<RadioItemProps>[];
  variant?: "clear" | "card" | "sunk";
  className?: string;
  style?: React.CSSProperties;
}

const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>((props, ref) => {
  const { children, className, style, variant = "clear", ...rest } = props;
  return (
    <Radio.Root
      ref={ref}
      className={clsx("crayon-radio-group", `crayon-radio-group-${variant}`, className)}
      style={style}
      {...rest}
    >
      {children}
    </Radio.Root>
  );
});

RadioGroup.displayName = "RadioGroup";

export { RadioGroup, type RadioGroupProps };
