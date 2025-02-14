import React, { forwardRef, useRef } from "react";
import { DayPicker } from "react-day-picker";
import { useLayoutContext } from "../../context/LayoutContext";
import { useMultipleRefs } from "../../hooks/useMultipleRefs";
import {
  MonthsDropdown,
  NextMonthButton,
  PreviousMonthButton,
  YearsDropdown,
} from "./components/HelperComponents";
import { getDayPickerStyles } from "./utils/styles";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const Calendar = forwardRef<HTMLDivElement, CalendarProps>(
  ({ className, classNames, ...props }, ref) => {
    const { layout } = useLayoutContext();
    const { DateSingleClasses, DateRangeClasses } = getDayPickerStyles(layout);
    const containerRef = useRef<HTMLDivElement>(null);
    const assignRef = useMultipleRefs(ref, containerRef);

    const commonProps = {
      captionLayout: "dropdown" as const,
      components: {
        NextMonthButton,
        PreviousMonthButton,
        MonthsDropdown: (props: any) => (
          <MonthsDropdown {...props} container={containerRef.current} />
        ),
        YearsDropdown: (props: any) => (
          <YearsDropdown {...props} container={containerRef.current} />
        ),
      },
    };

    return (
      <div ref={assignRef}>
        <DayPicker
          {...commonProps}
          {...props}
          classNames={{
            ...(props.mode === "single" || props.mode === "multiple"
              ? DateSingleClasses
              : DateRangeClasses),
            ...classNames,
          }}
          className={className}
        />
      </div>
    );
  },
);

export { Calendar };
