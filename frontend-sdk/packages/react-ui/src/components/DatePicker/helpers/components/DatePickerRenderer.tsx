import clsx from "clsx";
import { forwardRef, useRef } from "react";
import { DayPicker } from "react-day-picker";
import { useMultipleRefs } from "../../../../hooks/useMultipleRefs";
import { useDatePicker } from "../context/DatePickerContext";
import { getDayPickerStyles } from "../utils/styles";
import {
  MonthsDropdown,
  NextMonthButton,
  PreviousMonthButton,
  YearsDropdown,
} from "./HelperComponents";

const DatepickerRenderer = forwardRef<
  HTMLDivElement,
  { className?: string; style?: React.CSSProperties }
>(({ className, style }, ref) => {
  const { selectedDate, selectedRange, mode, botType, setSelectedDate, setSelectedRange } =
    useDatePicker();

  const { DateSingleClasses, DateRangeClasses } = getDayPickerStyles(botType);

  const containerRef = useRef<HTMLDivElement>(null);

  const assignRef = useMultipleRefs(ref, containerRef);

  const commonProps = {
    captionLayout: "dropdown" as const,
    startMonth: new Date(1900, 0),
    endMonth: new Date(2100, 11),
    components: {
      NextMonthButton,
      PreviousMonthButton,
      MonthsDropdown: (props: any) => (
        <MonthsDropdown {...props} container={containerRef.current} />
      ),
      YearsDropdown: (props: any) => <YearsDropdown {...props} container={containerRef.current} />,
    },
  };

  if (mode === "single") {
    return (
      <div
        ref={assignRef}
        className={clsx("crayon-date-picker-renderer-single-mode", className)}
        style={style}
      >
        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          classNames={DateSingleClasses}
          {...commonProps}
        />
      </div>
    );
  }

  return (
    <div
      ref={assignRef}
      className={clsx("crayon-date-picker-renderer-range-mode", className)}
      style={style}
    >
      <DayPicker
        mode="range"
        selected={selectedRange}
        onSelect={setSelectedRange}
        classNames={DateRangeClasses}
        {...commonProps}
      />
    </div>
  );
});

export { DatepickerRenderer };
