import * as SelectPrimitive from "@radix-ui/react-select";
import clsx from "clsx";
import debounce from "lodash-es/debounce";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  forwardRef,
  SelectHTMLAttributes,
  useEffect,
  useState,
} from "react";
import { ClassNames, CustomComponents, DropdownOption } from "react-day-picker";
import "react-day-picker/style.css";
import { IconButton } from "../../../IconButton";
import { Select, SelectTrigger, SelectValue } from "../../../Select";
import { getMonthName, getMonthNumber } from "../utils/helperFn";

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

// this component is overriding the default SelectContent component to allow for a container prop we do not wish to give to the user
const SelectContent = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
    container?: HTMLDivElement | null;
  }
>(({ className, children, position = "popper", container, ...props }, ref) => (
  <SelectPrimitive.Portal container={container || document.body}>
    <SelectPrimitive.Content
      ref={ref}
      className={clsx("crayon-select-content", className)}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport className="crayon-select-viewport" data-position={position}>
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));

export const MonthsDropdown = (
  props: {
    classNames: ClassNames;
    components: CustomComponents;
    options?: DropdownOption[];
  } & Omit<
    DetailedHTMLProps<SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>,
    "children"
  > & {
      container?: HTMLDivElement | null;
    },
) => {
  const {
    className,
    disabled,
    onChange,
    options,
    value,
    key,
    "aria-label": ariaLabel,
    container,
  } = props;

  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    if (!container) return;

    const targetElement = container.children[0]?.children[0];
    if (!targetElement) return;

    const resizeObserver = new ResizeObserver(
      debounce((entries) => {
        const { width, height } = entries[0]?.contentRect || {};
        setContainerWidth(width || 0);
        setContainerHeight(height || 0);
      }, 100),
    );

    resizeObserver.observe(targetElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [container]);

  return (
    <Select
      onValueChange={(value) =>
        onChange?.({
          target: { value: getMonthNumber(value) },
        } as any)
      }
      value={getMonthName(Number(value))}
      disabled={disabled}
      key={key}
      aria-label={ariaLabel}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={"Select a month"} />
      </SelectTrigger>
    </Select>
  );
};
