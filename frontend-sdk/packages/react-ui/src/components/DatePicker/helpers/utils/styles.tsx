import { ClassNames, getDefaultClassNames } from "react-day-picker";

export const getDayPickerStyles = (botType: "mobile" | "fullscreen" | "tray" | "copilot") => {
  const defaultClassNames = getDefaultClassNames();

  const commonClassNames: Partial<ClassNames> = {
    root: `${defaultClassNames.root} crayon-date-picker-root`,
    nav: `${defaultClassNames.nav} crayon-date-picker-nav-${botType}`,
    dropdowns: `${defaultClassNames.dropdowns} crayon-date-picker-dropdowns-${botType}`,
    month_grid: `crayon-date-picker-month-grid`,
    button_next: `crayon-date-picker-button-next crayon-date-picker-button-next-${botType}`,
    button_previous: `crayon-date-picker-button-previous crayon-date-picker-button-previous-${botType}`,
    today: `crayon-date-picker-today`,
    disabled: `crayon-date-picker-disabled`,
    weekdays: `crayon-date-picker-weekdays`,
    chevron: `crayon-date-picker-chevron`,
    month: `crayon-date-picker-month`,
    months_dropdown: `crayon-date-picker-months-dropdown`,
    years_dropdown: `crayon-date-picker-years-dropdown`,
  };

  const DateSingleClasses: Partial<ClassNames> = {
    ...commonClassNames,
    day_button: "crayon-date-picker-single-day-button",
    day: "crayon-date-picker-single-day",
    selected: "crayon-date-picker-single-day-selected",
  };

  const DateRangeClasses: Partial<ClassNames> = {
    ...commonClassNames,
    selected: "",
    range_start: "crayon-date-picker-range-start",
    range_middle: "crayon-date-picker-range-middle",
    range_end: "crayon-date-picker-range-end",
    day_button: "crayon-date-picker-range-day-button",
    day: "crayon-date-picker-range-day",
  };

  return {
    DateSingleClasses,
    DateRangeClasses,
  };
};
