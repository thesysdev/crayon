import * as Radio from "@radix-ui/react-radio-group";
import clsx from "clsx";
import { RadioItemProps } from "../RadioItem";

interface RadioGroupProps extends Radio.RadioGroupProps {
  children: React.ReactElement<RadioItemProps>;
  variant?: "clear" | "card" | "sunk";
  className?: string;
  style?: React.CSSProperties;
}

const RadioGroup = (props: RadioGroupProps) => {
  const { children, className, style, variant = "clear", ...rest } = props;
  return (
    <Radio.Root
      className={clsx("crayon-radio-group", `crayon-radio-group-${variant}`, className)}
      style={style}
      {...rest}
    >
      {children}
    </Radio.Root>
  );
};

export { RadioGroup, type RadioGroupProps };
