import { ClassNames, getDefaultClassNames } from "react-day-picker";

type BotType = "mobile" | "fullscreen" | "tray" | "copilot";
export const getDayPickerStyles = (botType: BotType) => {
  const defaultClassNames = getDefaultClassNames();

  const botTypeMapNav: Record<BotType, string> = {
    mobile: "crayon-calendar-nav-mobile",
    fullscreen: "crayon-calendar-nav-fullscreen",
    tray: "crayon-calendar-nav-tray",
    copilot: "crayon-calendar-nav-copilot",
  };

  const botTypeMapDropdowns: Record<BotType, string> = {
    mobile: "crayon-calendar-dropdowns-mobile",
    fullscreen: "crayon-calendar-dropdowns-fullscreen",
    tray: "crayon-calendar-dropdowns-tray",
    copilot: "crayon-calendar-dropdowns-copilot",
  };

  const commonClassNames: Partial<ClassNames> = {
    root: `${defaultClassNames.root} crayon-calendar-root`,
    nav: `${defaultClassNames.nav} ${botTypeMapNav[botType]}`,
    dropdowns: `${defaultClassNames.dropdowns} ${botTypeMapDropdowns[botType]}`,
    month_grid: `crayon-calendar-month-grid`,
    button_next: `crayon-calendar-button-next `,
    button_previous: `crayon-calendar-button-previous `,
    today: `crayon-calendar-today`,
    disabled: `crayon-calendar-disabled`,
    weekdays: `crayon-calendar-weekdays`,
    chevron: `crayon-calendar-chevron`,
    month: `crayon-calendar-month`,
    months_dropdown: `crayon-calendar-months-dropdown`,
    years_dropdown: `crayon-calendar-years-dropdown`,
    footer: `crayon-calendar-footer`,
  };

  const DateSingleClasses: Partial<ClassNames> = {
    ...commonClassNames,
    day_button: "crayon-calendar-single-day-button",
    day: "crayon-calendar-single-day",
    selected: "crayon-calendar-single-day-selected",
  };

  const DateRangeClasses: Partial<ClassNames> = {
    ...commonClassNames,
    selected: "",
    range_start: "crayon-calendar-range-start",
    range_middle: "crayon-calendar-range-middle",
    range_end: "crayon-calendar-range-end",
    day_button: "crayon-calendar-range-day-button",
    day: "crayon-calendar-range-day",
  };

  return {
    DateSingleClasses,
    DateRangeClasses,
  };
};
