import React, { createContext, useContext } from "react";
import { DateRange } from "react-day-picker";

interface DatePickerContextType {
  selectedDate: Date | null;
  selectedRange: DateRange;
  isOpen: boolean;
  mode: "single" | "range";
  botType: "mobile" | "fullScreen" | "tray" | "copilot";

  setSelectedDate: (date: Date | null) => void;
  setSelectedRange: (range: DateRange) => void;
  setIsOpen: (isOpen: boolean) => void;
  setMode: (mode: "single" | "range") => void;
}

const defaultContext: DatePickerContextType = {
  selectedDate: null,
  selectedRange: { from: undefined, to: undefined },
  isOpen: false,
  mode: "single",
  botType: "fullScreen",

  setSelectedDate: (date: Date | null) => {},
  setSelectedRange: (range: DateRange) => {},
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
  selectedDate: Date | null;
  selectedRange: DateRange;
  mode: "single" | "range";
  isOpen: boolean;
  botType: "mobile" | "fullScreen" | "tray" | "copilot";

  setSelectedDate: (date: Date | null) => void;
  setSelectedRange: (range: DateRange) => void;
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
