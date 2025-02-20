import { ColorTheme, EffectTheme, LayoutTheme, Theme, ThemeMode, TypographyTheme } from "./types";

export type ThemeProps = {
  mode?: ThemeMode;
  children?: React.ReactNode;
  // merged with lightTheme or darkTheme(if darkTheme is not provided)
  theme?: Theme;
  darkTheme?: Theme;
};

const lightTheme: ColorTheme = {
  // Background colors
  backgroundFills: "rgb(245, 245, 245)",
  brandElFills: "rgb(0, 0, 0)",
  brandElHoverFills: "rgba(0, 0, 0, 0.8)",
  containerFills: "rgb(255, 255, 255)",
  overlayFills: "rgba(0, 0, 0, 0.4)",
  sunkFills: "rgba(0, 0, 0, 0.04)",
  containerHoverFills: "rgba(255, 255, 255, 0.04)",
  dangerFills: "rgba(217, 45, 32, 0.08)",
  successFills: "rgba(7, 148, 85, 0.08)",

  // Border colors
  strokeDefault: "rgba(0, 0, 0, 0.06)",
  strokeInteractiveEl: "rgba(0, 0, 0, 0.12)",
  strokeInteractiveElHover: "rgba(0, 0, 0, 0.4)",
  strokeInteractiveElSelected: "rgb(0, 0, 0)",

  // Text colors
  brandText: "rgba(255, 255, 255, 1)",
  brandSecondaryText: "rgba(255, 255, 255, 0.4)",
  primaryText: "rgba(0, 0, 0, 1)",
  secondaryText: "rgba(0, 0, 0, 0.4)",
  disabledText: "rgba(0, 0, 0, 0.2)",
  dangerText: "rgba(217, 45, 32, 1)",
  successText: "rgba(7, 148, 85, 1)",
  linkText: "rgba(0, 0, 0, 1)",
  infoText: "rgba(0, 0, 0, 0.4)",
} as const;

const darkTheme: ColorTheme = {
  // Background colors
  backgroundFills: "rgb(28, 28, 28)",
  brandElFills: "rgb(255, 255, 255)",
  brandElHoverFills: "rgba(255, 255, 255, 0.8)",
  containerFills: "rgb(43, 43, 43)",
  overlayFills: "rgba(0, 0, 0, 0.4)",
  sunkFills: "rgba(0, 0, 0, 0.2)",
  containerHoverFills: "rgba(255, 255, 255, 0.1)",
  dangerFills: "rgba(217, 45, 32, 0.1)",
  successFills: "rgba(7, 148, 85, 0.1)",

  // Border colors
  strokeDefault: "rgba(255, 255, 255, 0.06)",
  strokeInteractiveEl: "rgba(255, 255, 255, 0.12)",
  strokeInteractiveElHover: "rgba(255, 255, 255, 0.4)",
  strokeInteractiveElSelected: "rgba(255, 255, 255, 1)",

  // Text colors
  brandText: "rgba(0, 0, 0, 1)",
  brandSecondaryText: "rgba(255, 255, 255, 0.4)",
  primaryText: "rgba(255, 255, 255, 1)",
  secondaryText: "rgba(255, 255, 255, 0.6)",
  disabledText: "rgba(255, 255, 255, 0.2)",
  dangerText: "rgba(253, 162, 155, 1)",
  successText: "rgba(117, 224, 167, 1)",
  linkText: "rgba(255, 255, 255, 1)",
  infoText: "rgba(255, 255, 255, 0.6)",
} as const;

// Shared theme properties that don't change between light/dark modes
const layoutTheme: LayoutTheme = {
  // Spacing
  spacing0: "0px",
  spacing3xs: "2px",
  spacing2xs: "4px",
  spacingXs: "6px",
  spacingS: "8px",
  spacingM: "12px",
  spacingL: "18px",
  spacingXl: "24px",
  spacing2xl: "36px",
  spacing3xl: "48px",

  // Radius
  rounded0: "0px",
  rounded3xs: "1px",
  rounded2xs: "2px",
  roundedXs: "4px",
  roundedS: "6px",
  roundedM: "8px",
  roundedL: "10px",
  roundedXl: "12px",
  rounded2xl: "16px",
  rounded3xl: "20px",
  rounded4xl: "24px",
  roundedFull: "999px",
  roundedClickable: "6px",
} as const;

const typographyTheme: TypographyTheme = {
  // Typography
  fontPrimary: '400 14px/20px "Inter"',
  fontPrimaryLetterSpacing: "0px",

  // Display & Headings
  // Large
  fontHeadingLarge: '600 28px/36px "Inter"',
  fontHeadingLargeLetterSpacing: "0px",
  // Medium
  fontHeadingMedium: '600 24px/32px "Inter"',
  fontHeadingMediumLetterSpacing: "0px",
  // Small
  fontHeadingSmall: '600 18px/24px "Inter"',
  fontHeadingSmallLetterSpacing: "0px",

  // Title Variants
  // Default
  fontTitle: '500 14px/20px "Inter"',
  fontTitleLetterSpacing: "0px",
  // Medium
  fontTitleMedium: '500 16px/24px "Inter"',
  fontTitleMediumLetterSpacing: "0px",
  // Small
  fontTitleSmall: '500 14px/20px "Inter"',
  fontTitleSmallLetterSpacing: "0px",

  // Body Text
  // Regular
  fontBody: '400 14px/18px "Inter"',
  fontBodyLetterSpacing: "0px",

  fontBodyMedium: '400 16px/24px "Inter"',
  fontBodyMediumLetterSpacing: "0px",

  fontBodySmall: '400 14px/20px "Inter"',
  fontBodySmallLetterSpacing: "0px",
  // Heavy
  fontBodyHeavy: '600 16px/24px "Inter"',
  fontBodyHeavyLetterSpacing: "0px",

  fontBodySmallHeavy: '600 14px/20px "Inter"',
  fontBodySmallHeavyLetterSpacing: "0px",
  // Special
  fontBodyLink: '500 14px/18px "Inter"',
  fontBodyLinkLetterSpacing: "0px",

  // Label System
  // Large
  fontLabelLarge: '400 12px/16px "Inter"',
  fontLabelLargeLetterSpacing: "0px",

  fontLabelLargeHeavy: '500 12px/16px "Inter"',
  fontLabelLargeHeavyLetterSpacing: "0px",
  // Regular
  fontLabel: '400 12px/16px "Inter"',
  fontLabelLetterSpacing: "0px",

  fontLabelHeavy: '500 12px/16px "Inter"',
  fontLabelHeavyLetterSpacing: "0px",
  // Medium
  fontLabelMedium: '400 10px/16px "Inter"',
  fontLabelMediumLetterSpacing: "0px",

  fontLabelMediumHeavy: '600 10px/16px "Inter"',
  fontLabelMediumHeavyLetterSpacing: "0px",
  // Small
  fontLabelSmall: '400 10px/16px "Inter"',
  fontLabelSmallLetterSpacing: "0px",

  fontLabelSmallHeavy: '500 10px/16px "Inter"',
  fontLabelSmallHeavyLetterSpacing: "0px",
  // Extra Small
  fontLabelExtraSmall: '400 8px/12px "Inter"',
  fontLabelExtraSmallLetterSpacing: "0px",

  fontLabelExtraSmallHeavy: '500 8px/12px "Inter"',
  fontLabelExtraSmallHeavyLetterSpacing: "0px",
} as const;

const effectTheme: EffectTheme = {
  // Shadows
  shadowS: "0px 2px 4px -2px rgba(0, 0, 0, 0.04), 0px 1px 2px -2px rgba(0, 0, 0, 0.02)",
  shadowM: "0px 2px 2px -2px rgba(0, 0, 0, 0.05), 0px 4px 6px -2px rgba(0, 0, 0, 0.03)",
  shadowL: "0px 4px 4px -2px rgba(0, 0, 0, 0.05), 0px 4px 8px -2px rgba(0, 0, 0, 0.04)",
  shadowXl: "0px 6px 8px -4px rgba(0, 0, 0, 0.12), 0px 4px 20px -6px rgba(0, 0, 0, 0.08)",
  shadow2xl: "0px 6px 10px -6px rgba(0, 0, 0, 0.14), 0px 8px 32px -6px rgba(0, 0, 0, 0.12)",
  shadow3xl: "0px 12px 24px -4px rgba(0, 0, 0, 0.14), 0px 16px 32px -6px rgba(0, 0, 0, 0.12)",
} as const;

const themes = {
  light: { ...layoutTheme, ...lightTheme, ...typographyTheme, ...effectTheme },
  dark: { ...layoutTheme, ...darkTheme, ...typographyTheme, ...effectTheme },
} as const;

export const ThemeProvider = ({
  mode = "light",
  children,
  theme: userTheme = {},
  darkTheme: userDarkTheme,
}: ThemeProps) => {
  const baseTheme = themes[mode];
  const lightTheme = { ...baseTheme, ...userTheme };
  const darkTheme = { ...baseTheme, ...(userDarkTheme || userTheme) };
  const theme = mode === "light" ? lightTheme : darkTheme;

  return (
    <>
      <style>{`
        body {
          --crayon-background-fills: ${theme.backgroundFills};
          --crayon-brand-el-fills: ${theme.brandElFills};
          --crayon-brand-el-hover-fills: ${theme.brandElHoverFills};
          --crayon-container-fills: ${theme.containerFills};
          --crayon-overlay-fills: ${theme.overlayFills};
          --crayon-sunk-fills: ${theme.sunkFills};
          --crayon-container-hover-fills: ${theme.containerHoverFills};
          --crayon-danger-fills: ${theme.dangerFills};
          --crayon-success-fills: ${theme.successFills};

          --crayon-stroke-default: ${theme.strokeDefault};
          --crayon-stroke-interactive-el: ${theme.strokeInteractiveEl};
          --crayon-stroke-interactive-el-hover: ${theme.strokeInteractiveElHover};
          --crayon-stroke-interactive-el-selected: ${theme.strokeInteractiveElSelected};

          --crayon-brand-text: ${theme.brandText};
          --crayon-brand-secondary-text: ${theme.brandSecondaryText};
          --crayon-primary-text: ${theme.primaryText};
          --crayon-secondary-text: ${theme.secondaryText};
          --crayon-disabled-text: ${theme.disabledText};
          --crayon-danger-text: ${theme.dangerText};
          --crayon-success-text: ${theme.successText};
          --crayon-link-text: ${theme.linkText};
          --crayon-info-text: ${theme.infoText};

          --crayon-spacing-0: ${theme.spacing0};
          --crayon-spacing-3xs: ${theme.spacing3xs};
          --crayon-spacing-2xs: ${theme.spacing2xs};
          --crayon-spacing-xs: ${theme.spacingXs};
          --crayon-spacing-s: ${theme.spacingS};
          --crayon-spacing-m: ${theme.spacingM};
          --crayon-spacing-l: ${theme.spacingL};
          --crayon-spacing-xl: ${theme.spacingXl};
          --crayon-spacing-2xl: ${theme.spacing2xl};
          --crayon-spacing-3xl: ${theme.spacing3xl};

          --crayon-rounded-0: ${theme.rounded0};
          --crayon-rounded-3xs: ${theme.rounded3xs};
          --crayon-rounded-2xs: ${theme.rounded2xs};
          --crayon-rounded-xs: ${theme.roundedXs};
          --crayon-rounded-s: ${theme.roundedS};
          --crayon-rounded-m: ${theme.roundedM};
          --crayon-rounded-l: ${theme.roundedL};
          --crayon-rounded-xl: ${theme.roundedXl};
          --crayon-rounded-2xl: ${theme.rounded2xl};
          --crayon-rounded-3xl: ${theme.rounded3xl};
          --crayon-rounded-full: ${theme.roundedFull};

          --crayon-font-primary: ${theme.fontPrimary};
          --crayon-font-primary-letter-spacing: ${theme.fontPrimaryLetterSpacing};
          --crayon-font-title: ${theme.fontTitle};
          --crayon-font-title-letter-spacing: ${theme.fontTitleLetterSpacing};
          --crayon-font-title-medium: ${theme.fontTitleMedium};
          --crayon-font-title-medium-letter-spacing: ${theme.fontTitleMediumLetterSpacing};
          --crayon-font-title-small: ${theme.fontTitleSmall};
          --crayon-font-title-small-letter-spacing: ${theme.fontTitleSmallLetterSpacing};
          --crayon-font-body: ${theme.fontBody};
          --crayon-font-body-letter-spacing: ${theme.fontBodyLetterSpacing};
          --crayon-font-body-link: ${theme.fontBodyLink};
          --crayon-font-body-link-letter-spacing: ${theme.fontBodyLinkLetterSpacing};
          --crayon-font-body-heavy: ${theme.fontBodyHeavy};
          --crayon-font-body-heavy-letter-spacing: ${theme.fontBodyHeavyLetterSpacing};
          --crayon-font-body-medium: ${theme.fontBodyMedium};
          --crayon-font-body-medium-letter-spacing: ${theme.fontBodyMediumLetterSpacing};
          --crayon-font-body-small-heavy: ${theme.fontBodySmallHeavy};
          --crayon-font-body-small-heavy-letter-spacing: ${theme.fontBodySmallHeavyLetterSpacing};
          --crayon-font-body-small: ${theme.fontBodySmall};
          --crayon-font-body-small-letter-spacing: ${theme.fontBodySmallLetterSpacing};
          --crayon-font-label: ${theme.fontLabel};
          --crayon-font-label-letter-spacing: ${theme.fontLabelLetterSpacing};
          --crayon-font-label-heavy: ${theme.fontLabelHeavy};
          --crayon-font-label-heavy-letter-spacing: ${theme.fontLabelHeavyLetterSpacing};
          --crayon-font-label-small: ${theme.fontLabelSmall};
          --crayon-font-label-small-letter-spacing: ${theme.fontLabelSmallLetterSpacing};
          --crayon-font-label-small-heavy: ${theme.fontLabelSmallHeavy};
          --crayon-font-label-small-heavy-letter-spacing: ${theme.fontLabelSmallHeavyLetterSpacing};
          --crayon-font-label-extra-small: ${theme.fontLabelExtraSmall};
          --crayon-font-label-extra-small-letter-spacing: ${theme.fontLabelExtraSmallLetterSpacing};
          --crayon-font-label-extra-small-heavy: ${theme.fontLabelExtraSmallHeavy};
          --crayon-font-label-extra-small-heavy-letter-spacing: ${theme.fontLabelExtraSmallHeavyLetterSpacing};
          --crayon-font-label-large-heavy: ${theme.fontLabelLargeHeavy};
          --crayon-font-label-large-heavy-letter-spacing: ${theme.fontLabelLargeHeavyLetterSpacing};
          --crayon-font-label-large: ${theme.fontLabelLarge};
          --crayon-font-label-large-letter-spacing: ${theme.fontLabelLargeLetterSpacing};
          --crayon-font-label-medium-heavy: ${theme.fontLabelMediumHeavy};
          --crayon-font-label-medium-heavy-letter-spacing: ${theme.fontLabelMediumHeavyLetterSpacing};
          --crayon-font-label-medium: ${theme.fontLabelMedium};
          --crayon-font-label-medium-letter-spacing: ${theme.fontLabelMediumLetterSpacing};
          --crayon-font-heading-large: ${theme.fontHeadingLarge};
          --crayon-font-heading-large-letter-spacing: ${theme.fontHeadingLargeLetterSpacing};
          --crayon-font-heading-medium: ${theme.fontHeadingMedium};
          --crayon-font-heading-medium-letter-spacing: ${theme.fontHeadingMediumLetterSpacing};
          --crayon-font-heading-small: ${theme.fontHeadingSmall};
          --crayon-font-heading-small-letter-spacing: ${theme.fontHeadingSmallLetterSpacing};

          --crayon-shadow-s: ${theme.shadowS};
          --crayon-shadow-m: ${theme.shadowM};
          --crayon-shadow-l: ${theme.shadowL};
          --crayon-shadow-xl: ${theme.shadowXl};
          --crayon-shadow-2xl: ${theme.shadow2xl};
          --crayon-shadow-3xl: ${theme.shadow3xl};

          --crayon-chat-container-bg: ${theme.chatContainerBg || theme.backgroundFills};
          --crayon-chat-assistant-response-bg: ${theme.chatAssistantResponseBg || theme.containerFills};
          --crayon-chat-assistant-response-text: ${theme.chatAssistantResponseText || theme.primaryText};
          --crayon-chat-user-response-bg: ${theme.chatUserResponseBg || theme.brandElFills};
          --crayon-chat-user-response-text: ${theme.chatUserResponseText || theme.brandText};
        }
      `}</style>
      {children}
    </>
  );
};
