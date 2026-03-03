import { ClassNames, getDefaultClassNames } from "react-day-picker";

type BotType = "mobile" | "fullscreen" | "tray" | "copilot";
export const getDayPickerStyles = (botType: BotType) => {
  const defaultClassNames = getDefaultClassNames();

  const botTypeMapNav: Record<BotType, string> = {
    mobile: "openui-date-picker-nav-mobile",
    fullscreen: "openui-date-picker-nav-fullscreen",
    tray: "openui-date-picker-nav-tray",
    copilot: "openui-date-picker-nav-copilot",
  };

  const botTypeMapDropdowns: Record<BotType, string> = {
    mobile: "openui-date-picker-dropdowns-mobile",
    fullscreen: "openui-date-picker-dropdowns-fullscreen",
    tray: "openui-date-picker-dropdowns-tray",
    copilot: "openui-date-picker-dropdowns-copilot",
  };

  const commonClassNames: Partial<ClassNames> = {
    root: `${defaultClassNames.root} openui-date-picker-root`,
    nav: `${defaultClassNames.nav} ${botTypeMapNav[botType]}`,
    dropdowns: `${defaultClassNames.dropdowns} ${botTypeMapDropdowns[botType]}`,
    month_caption: `openui-date-picker-month-caption`,
    month_grid: `openui-date-picker-month-grid`,
    button_next: `openui-date-picker-button-next`,
    button_previous: `openui-date-picker-button-previous`,
    today: `openui-date-picker-today`,
    disabled: `openui-date-picker-disabled`,
    weekdays: `openui-date-picker-weekdays`,
    weekday: `openui-date-picker-weekday`,
    chevron: `openui-date-picker-chevron`,
    month: `openui-date-picker-month`,
    months_dropdown: `openui-date-picker-months-dropdown`,
    years_dropdown: `openui-date-picker-years-dropdown`,
  };

  const DateSingleClasses: Partial<ClassNames> = {
    ...commonClassNames,
    day_button: "openui-date-picker-single-day-button",
    day: "openui-date-picker-single-day",
    selected: "openui-date-picker-single-day-selected",
  };

  const DateRangeClasses: Partial<ClassNames> = {
    ...commonClassNames,
    selected: "",
    range_start: "openui-date-picker-range-start",
    range_middle: "openui-date-picker-range-middle",
    range_end: "openui-date-picker-range-end",
    day_button: "openui-date-picker-range-day-button",
    day: "openui-date-picker-range-day",
  };

  return {
    DateSingleClasses,
    DateRangeClasses,
  };
};
