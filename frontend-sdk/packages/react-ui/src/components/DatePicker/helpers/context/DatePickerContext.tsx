import React, { createContext, useContext } from "react";
import { DateRange } from "react-day-picker";

interface DatePickerContextType {
  selectedDate: Date | undefined;
  selectedRange: DateRange | undefined;
  isOpen: boolean;
  mode: "single" | "range";
  botType: "mobile" | "fullscreen" | "tray" | "copilot";

  setSelectedDate: (date: Date | undefined) => void;
  setSelectedRange: (range: DateRange | undefined) => void;
  setIsOpen: (isOpen: boolean) => void;
  setMode: (mode: "single" | "range") => void;
}

const defaultContext: DatePickerContextType = {
  selectedDate: undefined,
  selectedRange: { from: undefined, to: undefined },
  isOpen: false,
  mode: "single",
  botType: "fullscreen",

  setSelectedDate: (date: Date | undefined) => {},
  setSelectedRange: (range: DateRange | undefined) => {},
  setIsOpen: (isOpen: boolean) => {},
  setMode: (mode: "single" | "range") => {},
};

const DatePickerContext = createContext<DatePickerContextType>(defaultContext);

export const useDatePicker = () => {
  const context = useContext(DatePickerContext);
  if (!context) {
    throw new Error("useDatePicker must be used within a DatePickerProvider");
  }
  return context;
};

interface DatePickerProviderProps {
  children: React.ReactNode;
  selectedDate: Date | undefined;
  selectedRange: DateRange;
  mode: "single" | "range";
  isOpen: boolean;
  botType: "mobile" | "fullscreen" | "tray" | "copilot";

  setSelectedDate: (date: Date | undefined) => void;
  setSelectedRange: (range: DateRange | undefined) => void;
  setMode: (mode: "single" | "range") => void;
  setIsOpen: (isOpen: boolean) => void;
}

export const DatePickerProvider: React.FC<DatePickerProviderProps> = ({
  children,
  selectedDate,
  selectedRange,
  mode,
  isOpen,
  botType,
  setSelectedDate,
  setSelectedRange,
  setMode,
  setIsOpen,
}) => {
  return (
    <DatePickerContext.Provider
      value={{
        selectedDate,
        selectedRange,
        mode,
        isOpen,
        botType,
        setSelectedDate,
        setSelectedRange,
        setMode,
        setIsOpen,
      }}
    >
      {children}
    </DatePickerContext.Provider>
  );
};

export default DatePickerContext;
