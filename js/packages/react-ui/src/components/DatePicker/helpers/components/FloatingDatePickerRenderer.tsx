import { autoUpdate, flip, offset, useFloating } from "@floating-ui/react-dom";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { forwardRef, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useMultipleRefs } from "../../../../hooks/useMultipleRefs";
import { useTheme } from "../../../ThemeProvider";
import { useDatePicker } from "../context/DatePickerContext";
import { formatDateRange, formatSingleDate } from "../utils/helperFn";
import { DatepickerRenderer } from "./DatePickerRenderer";

const FloatingDateInput = () => {
  const { mode, selectedDate, selectedRange, isOpen, setIsOpen } = useDatePicker();
  const hasSelectedDate =
    mode === "single"
      ? !!selectedDate
      : !!(selectedRange && selectedRange.from && selectedRange.to);

  return (
    <div
      className={clsx("crayon-date-picker-renderer-floating-input-container", {
        "crayon-date-picker-renderer-floating-input-container-open": isOpen,
        "crayon-date-picker-renderer-floating-input-container-not-open": !isOpen,
        "crayon-date-picker-renderer-floating-input-container-has-no-selected-date":
          !hasSelectedDate,
      })}
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
      }}
    >
      <span className="crayon-date-picker-renderer-floating-input-container-text">
        {mode === "single" ? formatSingleDate(selectedDate) : formatDateRange(selectedRange)}
      </span>
      <ChevronDown
        size={16}
        className={clsx({ "crayon-date-picker-renderer-floating-input-container-icon": isOpen })}
      />
    </div>
  );
};

const FloatingDatePicker = forwardRef<HTMLDivElement>((_, ref) => {
  const { isOpen } = useDatePicker();
  const menuPositionDivRef = useRef<HTMLDivElement>(null);
  const { portalThemeClassName } = useTheme();

  const {
    refs: { setFloating, setReference },
    floatingStyles,
  } = useFloating({
    strategy: "absolute",
    placement: "bottom-start",
    whileElementsMounted: autoUpdate,
    middleware: [offset(5), flip()],
  });

  const menuPositionDivRefs = useMultipleRefs(setReference, menuPositionDivRef);
  const floatingRef = useMultipleRefs(setFloating, ref);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        ref={menuPositionDivRefs}
        className={clsx("crayon-date-picker-renderer-floating-reference")}
      />
      {createPortal(
        <div
          ref={floatingRef}
          style={{ ...floatingStyles, width: "fit-content" }}
          className={clsx("crayon-date-picker-renderer-floating-content", portalThemeClassName)}
        >
          <div className="crayon-date-picker-renderer-floating-menu">
            <DatepickerRenderer />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
});

export const FloatingDatePickerRenderer = ({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) => {
  const { isOpen, setIsOpen } = useDatePicker();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) {
        return;
      }
      setIsOpen(false);
    };

    document.body.addEventListener("click", handleClick);

    return () => {
      document.body.removeEventListener("click", handleClick);
    };
  }, [isOpen, setIsOpen]);

  return (
    <div
      className={clsx("crayon-date-picker-renderer-floating-container", className)}
      style={style}
    >
      <FloatingDateInput />
      <FloatingDatePicker ref={menuRef} />
    </div>
  );
};
