import { ClassNames, getDefaultClassNames } from "react-day-picker";

type BotType = "mobile" | "fullscreen" | "tray" | "copilot";
export const getDayPickerStyles = (botType: BotType) => {
  const defaultClassNames = getDefaultClassNames();

  const botTypeMapNav: Record<BotType, string> = {
    mobile: "openui-calendar-nav-mobile",
    fullscreen: "openui-calendar-nav-fullscreen",
    tray: "openui-calendar-nav-tray",
    copilot: "openui-calendar-nav-copilot",
  };

  const botTypeMapDropdowns: Record<BotType, string> = {
    mobile: "openui-calendar-dropdowns-mobile",
    fullscreen: "openui-calendar-dropdowns-fullscreen",
    tray: "openui-calendar-dropdowns-tray",
    copilot: "openui-calendar-dropdowns-copilot",
  };

  const commonClassNames: Partial<ClassNames> = {
    root: `${defaultClassNames.root} openui-calendar-root`,
    nav: `${defaultClassNames.nav} ${botTypeMapNav[botType]}`,
    dropdowns: `${defaultClassNames.dropdowns} ${botTypeMapDropdowns[botType]}`,
    month_caption: `openui-calendar-month-caption`,
    month_grid: `openui-calendar-month-grid`,
    button_next: `openui-calendar-button-next `,
    button_previous: `openui-calendar-button-previous `,
    today: `openui-calendar-today`,
    disabled: `openui-calendar-disabled`,
    weekdays: `openui-calendar-weekdays`,
    weekday: `openui-calendar-weekday`,
    chevron: `openui-calendar-chevron`,
    month: `openui-calendar-month`,
    months_dropdown: `openui-calendar-months-dropdown`,
    years_dropdown: `openui-calendar-years-dropdown`,
    footer: `openui-calendar-footer`,
  };

  const DateSingleClasses: Partial<ClassNames> = {
    ...commonClassNames,
    day_button: "openui-calendar-single-day-button",
    day: "openui-calendar-single-day",
    selected: "openui-calendar-single-day-selected",
  };

  const DateRangeClasses: Partial<ClassNames> = {
    ...commonClassNames,
    selected: "",
    range_start: "openui-calendar-range-start",
    range_middle: "openui-calendar-range-middle",
    range_end: "openui-calendar-range-end",
    day_button: "openui-calendar-range-day-button",
    day: "openui-calendar-range-day",
  };

  return {
    DateSingleClasses,
    DateRangeClasses,
  };
};
