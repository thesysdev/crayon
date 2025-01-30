import clsx from "clsx";
import { useDatePicker } from "../context/DatePickerContext";
import { formatDateRange, formatSingleDate } from "../utils/helperFn";
import { ChevronDown } from "lucide-react";

const FloatingDateInput = () => {
  const { mode, selectedDate, selectedRange, setSelectedDate, setSelectedRange, isOpen, setIsOpen } =
    useDatePicker();
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
            {
                mode === "single" ? formatSingleDate(selectedDate) : formatDateRange(selectedRange)
            }
      </span>
      <ChevronDown size={16} className={clsx("crayon-date-picker-renderer-floating-input-container-icon")} />
    </div>
  );
};

