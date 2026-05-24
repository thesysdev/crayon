import clsx from "clsx";
import { forwardRef } from "react";
import { Calendar } from "../../../Calendar";
import { useDatePicker } from "../context/DatePickerContext";

const DatepickerRenderer = forwardRef<
  HTMLDivElement,
  { className?: string; style?: React.CSSProperties }
>(({ className, style }, ref) => {
  const { selectedDate, selectedRange, mode, setSelectedDate, setSelectedRange } = useDatePicker();

  if (mode === "single") {
    return (
      <div
        ref={ref}
        className={clsx("openui-date-picker-renderer-single-mode", className)}
        style={style}
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          startMonth={new Date(1900, 0)}
          endMonth={new Date(2100, 11)}
        />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={clsx("openui-date-picker-renderer-range-mode", className)}
      style={style}
    >
      <Calendar
        mode="range"
        selected={selectedRange}
        onSelect={setSelectedRange}
        startMonth={new Date(1900, 0)}
        endMonth={new Date(2100, 11)}
      />
    </div>
  );
});

export { DatepickerRenderer };
