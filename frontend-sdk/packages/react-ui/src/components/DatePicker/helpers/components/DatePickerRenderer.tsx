import { useMultipleRefs } from "@/hooks/useMultipleRefs";
import { forwardRef, useRef } from "react";
import { DayPicker } from "react-day-picker";
import { useDatePicker } from "../context/DatePickerContext";
import { getDayPickerStyles } from "../utils/styles";
import {
  MonthsDropdown,
  NextMonthButton,
  PreviousMonthButton,
  YearsDropdown,
} from "./HelperComponents";

const DatepickerRenderer = forwardRef<HTMLDivElement>((_, ref) => {
  const { selectedDate, selectedRange, mode, botType, setSelectedDate, setSelectedRange } =
    useDatePicker();

  const { DateSingleClasses, DateRangeClasses } = getDayPickerStyles(botType);

  const containerRef = useRef<HTMLDivElement>(null);

  const assignRef = useMultipleRefs(ref, containerRef); // TODO: fix this ref assignment

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
      <div ref={containerRef} className="crayon-date-picker-renderer-single-mode">
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
    <div ref={containerRef} className="crayon-date-picker-renderer-range-mode">
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
