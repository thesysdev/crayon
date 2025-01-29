import { ChevronLeft, ChevronRight } from "lucide-react";
import { ButtonHTMLAttributes, DetailedHTMLProps } from "react";
import "react-day-picker/style.css";
import { IconButton } from "../../../IconButton";

export const PreviousMonthButton = (
  props: DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>,
) => {
  const { onClick, disabled, className, ...rest } = props;
  return (
    <IconButton
      icon={<ChevronLeft size={18} />}
      variant="secondary"
      size="medium"
      onClick={onClick}
      disabled={disabled}
      className={className}
      {...rest}
    />
  );
};

export const NextMonthButton = (
  props: DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>,
) => {
  const { onClick, disabled, className, ...rest } = props;
  return (
    <IconButton
      icon={<ChevronRight size={18} />}
      variant="secondary"
      size="medium"
      onClick={onClick}
      disabled={disabled}
      className={className}
      {...rest}
    />
  );
};
