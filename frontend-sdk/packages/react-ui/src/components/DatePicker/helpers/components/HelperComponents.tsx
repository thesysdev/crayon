import { ChevronLeft, ChevronRight } from "lucide-react";
import { ButtonHTMLAttributes, DetailedHTMLProps } from "react";
import "react-day-picker/style.css";
import { Button } from "../../../Button";

export const PreviousMonthButton = (
  props: DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>,
) => {
  const { onClick, disabled, className, ...rest } = props;
  return (
    <Button
      iconLeft={<ChevronLeft size={18} />}
      variant="secondary"
      size="medium"
      onClick={onClick}
      disabled={disabled}
      className={className}
      {...rest}
    >
      {""}
    </Button>
  );
};

export const NextMonthButton = (
  props: DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>,
) => {
  const { onClick, disabled, className, ...rest } = props;
  return (
    <Button
      iconLeft={<ChevronRight size={18} />}
      variant="secondary"
      size="medium"
      onClick={onClick}
      disabled={disabled}
      className={className}
      {...rest}
    >
      {""}
    </Button>
  );
};
