import { useState } from "react";
import { DateRange } from "react-day-picker";
import { useLayoutContext } from "../../context/LayoutContext";
import { FloatingDatePickerRenderer } from "./helpers/components/FloatingDatePickerRenderer";
import { DatePickerProvider } from "./helpers/context/DatePickerContext";

export interface DatePickerProps {
  mode?: "single" | "range";
  selectedSingleDate?: Date;
  selectedRangeDates?: DateRange;
  setSelectedSingleDate?: (date?: Date) => void;
  setSelectedRangeDates?: (range?: DateRange) => void;
  className?: string;
  style?: React.CSSProperties;
}

const DatePicker = (props: DatePickerProps) => {
  const { layout } = useLayoutContext();

  const {
    mode = "single",
    selectedSingleDate,
    selectedRangeDates,
    setSelectedSingleDate,
    setSelectedRangeDates,
    className,
    style,
  } = props;

  const [internalSelectedDate, setInternalSelectedDate] = useState<Date | undefined>(
    selectedSingleDate,
  );
  const [internalSelectedRange, setInternalSelectedRange] = useState<DateRange | undefined>(
    selectedRangeDates,
  );

  // this derived setter state is used to make this component more flexible
  // it allows the user to pass in a setter function from the parent component
  // if the parent component does not pass in a setter function, the internal setter state is used
  // this allows the user to pass in a setter function from the parent component, but still have the internal state be set

  // this design decision closely follow

  const selectedDateHandler = (selectedDate?: Date) => {
    if (selectedSingleDate) {
      setSelectedSingleDate?.(selectedDate);
      return;
    }

    setSelectedSingleDate?.(selectedDate);
    setInternalSelectedDate(selectedDate);
  };

  const selectedRangeHandler = (selectedRange?: DateRange) => {
    if (selectedRangeDates) {
      setSelectedRangeDates?.(selectedRange);
      return;
    }

    setSelectedRangeDates?.(selectedRange);
    setInternalSelectedRange(selectedRange);
  };

  return (
    <DatePickerProvider
      mode={mode}
      botType={layout}
      selectedDateFromParent={selectedSingleDate ?? internalSelectedDate}
      selectedRangeFromParent={selectedRangeDates ?? internalSelectedRange}
      setSelectedDateFromParent={selectedDateHandler}
      setSelectedRangeFromParent={selectedRangeHandler}
    >
      <FloatingDatePickerRenderer className={className} style={style} />
    </DatePickerProvider>
  );
};

export { DatePicker };
