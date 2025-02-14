import { ClassNames, getDefaultClassNames } from "react-day-picker";

type BotType = "mobile" | "fullscreen" | "tray" | "copilot";
export const getDayPickerStyles = (botType: BotType) => {
  const defaultClassNames = getDefaultClassNames();

  const botTypeMapNav: Record<BotType, string> = {
    mobile: "crayon-date-picker-nav-mobile",
    fullscreen: "crayon-date-picker-nav-fullscreen",
    tray: "crayon-date-picker-nav-tray",
    copilot: "crayon-date-picker-nav-copilot",
  };

  const botTypeMapDropdowns: Record<BotType, string> = {
    mobile: "crayon-date-picker-dropdowns-mobile",
    fullscreen: "crayon-date-picker-dropdowns-fullscreen",
    tray: "crayon-date-picker-dropdowns-tray",
    copilot: "crayon-date-picker-dropdowns-copilot",
  };

  const commonClassNames: Partial<ClassNames> = {
    root: `${defaultClassNames.root} crayon-date-picker-root`,
    nav: `${defaultClassNames.nav} ${botTypeMapNav[botType]}`,
    dropdowns: `${defaultClassNames.dropdowns} ${botTypeMapDropdowns[botType]}`,
    month_grid: `crayon-date-picker-month-grid`,
    button_next: `crayon-date-picker-button-next `,
    button_previous: `crayon-date-picker-button-previous `,
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
