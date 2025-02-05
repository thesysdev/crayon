import * as Radio from "@radix-ui/react-radio-group";
import clsx from "clsx";
import { CSSProperties, forwardRef, ReactElement } from "react";
import { RadioItemProps } from "../RadioItem";

type RadioGroupVariant = "clear" | "card" | "sunk";
interface RadioGroupProps extends Radio.RadioGroupProps {
  children: ReactElement<RadioItemProps> | ReactElement<RadioItemProps>[];
  variant?: RadioGroupVariant;
  className?: string;
  style?: CSSProperties;
}

const variants: Record<RadioGroupVariant, string> = {
  clear: "crayon-radio-group-clear",
  card: "crayon-radio-group-card",
  sunk: "crayon-radio-group-sunk",
};

const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>((props, ref) => {
  const { children, className, style, variant = "clear", ...rest } = props;
  return (
    <Radio.Root
      ref={ref}
      className={clsx("crayon-radio-group", variants[variant], className)}
      style={style}
      {...rest}
    >
      {children}
    </Radio.Root>
  );
});

RadioGroup.displayName = "RadioGroup";

export { RadioGroup, type RadioGroupProps };
