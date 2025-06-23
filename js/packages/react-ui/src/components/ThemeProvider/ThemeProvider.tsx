import React, { createContext, useContext } from "react";
import { ColorTheme, EffectTheme, LayoutTheme, Theme, ThemeMode, TypographyTheme } from "./types";

export type ThemeProps = {
  mode?: ThemeMode;
  children?: React.ReactNode;
  // merged with lightTheme or darkTheme(if darkTheme is not provided)
  theme?: Theme;
  darkTheme?: Theme;
};

type ThemeContextType = {
  theme: Theme;
  mode: ThemeMode;
};

// Update the context to include both theme and mode
export const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

// Update the hook to return both theme and mode
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: lightTheme,
      mode: "light",
    };
  }
  return context;
};

const lightTheme: ColorTheme = {
  // Background colors
  backgroundFills: "rgba(250, 250, 250, 1)",
  brandElFills: "rgba(127, 86, 217, 1)",
  brandElHoverFills: "rgba(127, 86, 217, 0.8)",
  containerFills: "rgba(253, 253, 253, 1)",
  overlayFills: "rgba(0, 0, 0, 0.4)",
  sunkFills: "rgba(0, 0, 0, 0.06)",
  containerHoverFills: "rgba(255, 255, 255, 0.04)",
  dangerFills: "rgba(203, 63, 73, 0.1)",
  successFills: "rgba(13, 160, 94, 0.1)",
  infoFills: "rgba(56, 148, 255, 0.1)",
  alertFills: "rgba(255, 199, 0, 0.1)",
  invertedFills: "rgba(21, 21, 21, 1)",
  elevatedFills: "rgba(255, 255, 255, 0.6)",
  sunkBgFills: "rgba(0, 0, 0, 0.04)",

  // Border colors
  strokeDefault: "rgba(0, 0, 0, 0.04)",
  strokeInteractiveEl: "rgba(0, 0, 0, 0.08)",
  strokeInteractiveElHover: "rgba(0, 0, 0, 0.4)",
  strokeInteractiveElSelected: "rgba(21, 21, 21, 1)",
  strokeEmphasis: "rgba(0, 0, 0, 0.2)",
  strokeAccent: "rgba(255, 255, 255, 0.08)",
  strokeAccentEmphasis: "rgba(255, 255, 255, 0.3)",
  strokeInfo: "rgba(56, 148, 255, 0.08)",
  strokeInfoEmphasis: "rgba(24, 130, 255, 1)",
  strokeAlert: "rgba(255, 199, 0, 0.08)",
  strokeAlertEmphasis: "rgba(255, 199, 0, 1)",
  strokeSuccess: "rgba(13, 160, 94, 0.08)",
  strokeSuccessEmphasis: "rgba(13, 160, 94, 1)",
  strokeDanger: "rgba(203, 63, 73, 0.08)",
  strokeDangerEmphasis: "rgba(200, 44, 55, 1)",

  // Text colors
  brandText: "rgba(255, 255, 255, 1)",
  brandSecondaryText: "rgba(255, 255, 255, 0.4)",
  primaryText: "rgba(0, 0, 0, 1)",
  secondaryText: "rgba(0, 0, 0, 0.4)",
  disabledText: "rgba(0, 0, 0, 0.2)",
  dangerText: "rgba(217, 45, 32, 1)",
  successText: "rgba(13, 160, 94, 0.10)",
  linkText: "rgba(0, 0, 0, 1)",
  infoText: "rgba(56, 148, 255, 1)",
  accentPrimaryText: "rgba(255, 255, 255, 1)",
  accentSecondaryText: "rgba(255, 255, 255, 0.4)",
  accentDisabledText: "rgba(255, 255, 255, 0.2)",
  successPrimaryText: "rgba(8, 93, 58, 1)",
  successInvertedText: "rgba(220, 250, 230, 1)",
  alertPrimaryText: "rgba(221, 159, 0, 1)",
  alertInvertedText: "rgba(255, 246, 205, 1)",
  dangerPrimaryText: "rgba(167, 39, 47, 1)",
  dangerSecondaryText: "rgba(203, 63, 73, 1)",
  dangerDisabledText: "rgba(235, 167, 171, 1)",
  dangerInvertedPrimaryText: "rgba(255, 255, 255, 1)",
  dangerInvertedSecondaryText: "rgba(255, 255, 255, 0.4)",
  dangerInvertedDisabledText: "rgba(255, 255, 255, 0.2)",
  infoPrimaryText: "rgba(21, 93, 177, 1)",
  infoInvertedText: "rgba(219, 236, 255, 1)",

  // Interactive colors
  interactiveDefault: "rgba(255, 255, 255, 0.02)",
  interactiveHover: "rgba(0, 0, 0, 0.06)",
  interactivePressed: "rgba(0, 0, 0, 0.04)",
  interactiveDisabled: "rgba(0, 0, 0, 0.02)",
  interactiveAccent: "rgba(24, 130, 255, 1)",
  interactiveAccentHover: "rgba(70, 160, 247, 1)",
  interactiveAccentPressed: "rgba(32, 107, 213, 1)",
  interactiveAccentDisabled: "rgba(56, 148, 255, 0.4)",
  interactiveDestructive: "rgba(203, 63, 73, 0.02)",
  interactiveDestructiveHover: "rgba(203, 63, 73, 0.08)",
  interactiveDestructivePressed: "rgba(203, 63, 73, 0.1)",
  interactiveDestructiveDisabled: "rgba(203, 63, 73, 0.02)",
  interactiveDestructiveAccent: "rgba(200, 44, 55, 1)",
  interactiveDestructiveAccentHover: "rgba(203, 63, 73, 1)",
  interactiveDestructiveAccentPressed: "rgba(167, 39, 47, 1)",
  interactiveDestructiveAccentDisabled: "rgba(203, 63, 73, 0.4)",
} as const;

const darkTheme: ColorTheme = {
  // Background colors
  backgroundFills: "rgba(21, 21, 21, 1)",
  brandElFills: "rgba(127, 86, 217, 1)",
  brandElHoverFills: "rgba(127, 86, 217, 0.8)",
  containerFills: "rgba(28, 28, 28, 1)",
  overlayFills: "rgba(0, 0, 0, 0.4)",
  sunkFills: "rgba(255, 255, 255, 0.08)",
  containerHoverFills: "rgba(255, 255, 255, 0.1)",
  dangerFills: "rgba(203, 63, 73, 0.2)",
  successFills: "rgba(13, 160, 94, 0.2)",
  infoFills: "rgba(56, 148, 255, 0.2)",
  alertFills: "rgba(255, 199, 0, 0.2)",
  elevatedFills: "rgba(255, 255, 255, 0.06)",
  invertedFills: "rgba(253, 253, 253, 1)",
  sunkBgFills: "rgba(0, 0, 0, 0.16)",

  // Border colors
  strokeDefault: "rgba(255, 255, 255, 0.04)",
  strokeInteractiveEl: "rgba(255, 255, 255, 0.1)",
  strokeInteractiveElHover: "rgba(255, 255, 255, 0.4)",
  strokeInteractiveElSelected: "rgba(253, 253, 253, 1)",
  strokeEmphasis: "rgba(255, 255, 255, 0.2)",
  strokeAccent: "rgba(0, 0, 0, 0.08)",
  strokeAccentEmphasis: "rgba(0, 0, 0, 0.3)",
  strokeInfo: "rgba(56, 148, 255, 0.2)",
  strokeInfoEmphasis: "rgba(24, 130, 255, 1)",
  strokeAlert: "rgba(255, 199, 0, 0.2)",
  strokeAlertEmphasis: "rgba(255, 199, 0, 1)",
  strokeSuccess: "rgba(13, 160, 94, 0.2)",
  strokeSuccessEmphasis: "rgba(13, 160, 94, 1)",
  strokeDanger: "rgba(203, 63, 73, 0.2)",
  strokeDangerEmphasis: "rgba(200, 44, 55, 1)",

  // Text colors
  brandText: "rgba(255, 255, 255, 1)",
  brandSecondaryText: "rgba(255, 255, 255, 0.4)",
  primaryText: "rgba(255, 255, 255, 1)",
  secondaryText: "rgba(255, 255, 255, 0.4)",
  disabledText: "rgba(255, 255, 255, 0.2)",
  dangerText: "rgba(253, 162, 155, 1)",
  successText: "rgba(117, 224, 167, 1)",
  linkText: "rgba(255, 255, 255, 1)",
  infoText: "rgba(125, 179, 247, 1)",
  accentPrimaryText: "rgba(255, 255, 255, 1)",
  accentSecondaryText: "rgba(255, 255, 255, 0.4)",
  accentDisabledText: "rgba(255, 255, 255, 0.2)",
  successPrimaryText: "rgba(23, 178, 106, 1)",
  successInvertedText: "rgba(2, 79, 48, 1)",
  alertPrimaryText: "rgba(243, 207, 80, 1)",
  alertInvertedText: "rgba(187, 122, 0, 1)",
  dangerPrimaryText: " rgba(203, 63, 73, 1)",
  dangerSecondaryText: "rgba(167, 39, 47, 1)",
  dangerDisabledText: "rgba(130, 26, 32, 1)",
  dangerInvertedPrimaryText: "rgba(255, 255, 255, 1)",
  dangerInvertedSecondaryText: "rgba(255, 255, 255, 0.4)",
  dangerInvertedDisabledText: "rgba(255, 255, 255, 0.2)",
  infoPrimaryText: "rgba(70, 160, 247, 1)",
  infoInvertedText: "rgba(13, 75, 148, 1)",

  // Interactive colors
  interactiveDefault: "rgba(0, 0, 0, 0.02)",
  interactiveHover: "rgba(255, 255, 255, 0.06)",
  interactivePressed: "rgba(255, 255, 255, 0.04)",
  interactiveDisabled: "rgba(255, 255, 255, 0.02)",
  interactiveAccent: "rgba(24, 130, 255, 1)",
  interactiveAccentHover: "rgba(70, 160, 247, 1)",
  interactiveAccentPressed: "rgba(32, 107, 213, 1)",
  interactiveAccentDisabled: "rgba(56, 148, 255, 0.4)",
  interactiveDestructive: "rgba(203, 63, 73, 0.2)",
  interactiveDestructiveHover: "rgba(203, 63, 73, 0.3)",
  interactiveDestructivePressed: "rgba(203, 63, 73, 0.3)",
  interactiveDestructiveDisabled: "rgba(203, 63, 73, 0.2)",
  interactiveDestructiveAccent: "rgba(200, 44, 55, 1)",
  interactiveDestructiveAccentHover: "rgba(210, 65, 75, 1)",
  interactiveDestructiveAccentPressed: "rgba(167, 39, 47, 1)",
  interactiveDestructiveAccentDisabled: "rgba(203, 63, 73, 0.4)",
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
  fontPrimary: '400 16px/20px "Inter"',
  fontPrimaryLetterSpacing: "0px",

  // Display & Headings
  // Large
  fontHeadingLarge: '600 28px/32.2px "Inter"',
  fontHeadingLargeLetterSpacing: "0px",
  // Medium
  fontHeadingMedium: '600 24px/27.6px "Inter"',
  fontHeadingMediumLetterSpacing: "0px",
  // Small
  fontHeadingSmall: '500 18px/22.5px "Inter"',
  fontHeadingSmallLetterSpacing: "0px",

  // Title Variants
  // Default
  fontTitle: '500 16px/20px "Inter"',
  fontTitleLetterSpacing: "0px",
  // Medium
  fontTitleMedium: '500 16px/20px "Inter"',
  fontTitleMediumLetterSpacing: "0px",
  // Small
  fontTitleSmall: '500 16px/20px "Inter"',
  fontTitleSmallLetterSpacing: "0px",

  // Body Text
  // Regular
  fontBody: '400 16px/24px "Inter"',
  fontBodyLetterSpacing: "0px",

  fontBodyMedium: '400 16px/20px "Inter"',
  fontBodyMediumLetterSpacing: "0px",

  fontBodySmall: '400 14px/21px "Inter"',
  fontBodySmallLetterSpacing: "0px",
  // Heavy
  fontBodyHeavy: '500 16px/24px "Inter"',
  fontBodyHeavyLetterSpacing: "0px",

  fontBodySmallHeavy: '600 16px/20px "Inter"',
  fontBodySmallHeavyLetterSpacing: "0px",

  // Large
  fontBodyLarge: '500 18px/27px "Inter"',
  fontBodyLargeLetterSpacing: "0px",

  fontBodyLargeHeavy: '500 18px/27px "Inter"',
  fontBodyLargeHeavyLetterSpacing: "0px",

  // Special
  fontBodyLink: '400 16px/19.2px "Inter"',
  fontBodyLinkLetterSpacing: "0px",

  // Label System
  // Large
  fontLabelLarge: '400 16px/19.2px "Inter"',
  fontLabelLargeLetterSpacing: "0px",

  fontLabelLargeHeavy: '500 16px/19.2px "Inter"',
  fontLabelLargeHeavyLetterSpacing: "0px",
  // Regular
  fontLabel: '400 14px/16.8px "Inter"',
  fontLabelLetterSpacing: "0px",

  fontLabelHeavy: '500 14px/16.8px "Inter"',
  fontLabelHeavyLetterSpacing: "0px",
  // Medium
  fontLabelMedium: '400 16px/20px "Inter"',
  fontLabelMediumLetterSpacing: "0px",

  fontLabelMediumHeavy: '600 16px/20px "Inter"',
  fontLabelMediumHeavyLetterSpacing: "0px",
  // Small
  fontLabelSmall: '400 12px/14.4px "Inter"',
  fontLabelSmallLetterSpacing: "0px",

  fontLabelSmallHeavy: '500 12px/14.4px "Inter"',
  fontLabelSmallHeavyLetterSpacing: "0px",
  // Extra Small
  fontLabelExtraSmall: '400 10px/12px "Inter"',
  fontLabelExtraSmallLetterSpacing: "0px",

  fontLabelExtraSmallHeavy: '500 10px/12px "Inter"',
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
    <ThemeContext.Provider value={{ theme, mode }}>
      <style>{`
        body {
          --crayon-background-fills: ${theme.backgroundFills};
          --crayon-brand-el-fills: ${theme.interactiveAccent || theme.brandElFills};
          --crayon-brand-el-hover-fills: ${theme.interactiveAccentHover || theme.brandElHoverFills};
          --crayon-container-fills: ${theme.containerFills};
          --crayon-overlay-fills: ${theme.overlayFills};
          --crayon-sunk-fills: ${theme.sunkFills};
          --crayon-container-hover-fills: ${theme.sunkFills || theme.containerHoverFills};
          --crayon-danger-fills: ${theme.dangerFills};
          --crayon-success-fills: ${theme.successFills};
          --crayon-info-fills: ${theme.infoFills};
          --crayon-elevated-fills: ${theme.elevatedFills};
          --crayon-alert-fills: ${theme.alertFills};
          --crayon-inverted-fills: ${theme.invertedFills};
          --crayon-sunk-bg-fills: ${theme.sunkBgFills};

          --crayon-interactive-default: ${theme.interactiveDefault};
          --crayon-interactive-hover: ${theme.interactiveHover};
          --crayon-interactive-pressed: ${theme.interactivePressed};
          --crayon-interactive-disabled: ${theme.interactiveDisabled};
          --crayon-interactive-accent: ${theme.interactiveAccent};
          --crayon-interactive-accent-hover: ${theme.interactiveAccentHover};
          --crayon-interactive-accent-pressed: ${theme.interactiveAccentPressed};
          --crayon-interactive-accent-disabled: ${theme.interactiveAccentDisabled};
          --crayon-interactive-destructive: ${theme.interactiveDestructive};
          --crayon-interactive-destructive-hover: ${theme.interactiveDestructiveHover};
          --crayon-interactive-destructive-pressed: ${theme.interactiveDestructivePressed};
          --crayon-interactive-destructive-disabled: ${theme.interactiveDestructiveDisabled};
          --crayon-interactive-destructive-accent: ${theme.interactiveDestructiveAccent};
          --crayon-interactive-destructive-accent-hover: ${theme.interactiveDestructiveAccentHover};
          --crayon-interactive-destructive-accent-pressed: ${theme.interactiveDestructiveAccentPressed};
          --crayon-interactive-destructive-accent-disabled: ${theme.interactiveDestructiveAccentDisabled};

          --crayon-stroke-default: ${theme.strokeDefault};
          --crayon-stroke-interactive-el: ${theme.strokeInteractiveEl};
          --crayon-stroke-interactive-el-hover: ${theme.strokeEmphasis || theme.strokeInteractiveElHover};
          --crayon-stroke-interactive-el-selected: ${theme.strokeInteractiveElSelected};
          --crayon-stroke-emphasis: ${theme.strokeEmphasis};
          --crayon-stroke-accent: ${theme.strokeAccent};
          --crayon-stroke-accent-emphasis: ${theme.strokeAccentEmphasis};
          --crayon-stroke-info: ${theme.strokeInfo};
          --crayon-stroke-info-emphasis: ${theme.strokeInfoEmphasis};
          --crayon-stroke-alert: ${theme.strokeAlert};
          --crayon-stroke-alert-emphasis: ${theme.strokeAlertEmphasis};
          --crayon-stroke-success: ${theme.strokeSuccess};
          --crayon-stroke-success-emphasis: ${theme.strokeSuccessEmphasis};
          --crayon-stroke-danger: ${theme.strokeDanger};
          --crayon-stroke-danger-emphasis: ${theme.strokeDangerEmphasis};

          --crayon-brand-text: ${theme.accentPrimaryText || theme.brandText};
          --crayon-brand-secondary-text: ${theme.accentSecondaryText || theme.brandSecondaryText};
          --crayon-primary-text: ${theme.primaryText};
          --crayon-secondary-text: ${theme.secondaryText};
          --crayon-disabled-text: ${theme.disabledText};
          --crayon-danger-text: ${theme.dangerPrimaryText || theme.dangerText};
          --crayon-success-text: ${theme.successPrimaryText || theme.successText};
          --crayon-link-text: ${theme.linkText};
          --crayon-info-text: ${theme.infoPrimaryText || theme.infoText};
          --crayon-accent-primary-text: ${theme.accentPrimaryText};
          --crayon-accent-secondary-text: ${theme.accentSecondaryText};
          --crayon-accent-disabled-text: ${theme.accentDisabledText};
          --crayon-success-primary-text: ${theme.successPrimaryText};
          --crayon-success-inverted-text: ${theme.successInvertedText};
          --crayon-alert-primary-text: ${theme.alertPrimaryText};
          --crayon-alert-inverted-text: ${theme.alertInvertedText};
          --crayon-danger-primary-text: ${theme.dangerPrimaryText};
          --crayon-danger-secondary-text: ${theme.dangerSecondaryText};
          --crayon-danger-disabled-text: ${theme.dangerDisabledText};
          --crayon-danger-inverted-primary-text: ${theme.dangerInvertedPrimaryText};
          --crayon-danger-inverted-secondary-text: ${theme.dangerInvertedSecondaryText};
          --crayon-danger-inverted-disabled-text: ${theme.dangerInvertedDisabledText};
          --crayon-info-primary-text: ${theme.infoPrimaryText};
          --crayon-info-inverted-text: ${theme.infoInvertedText};

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
          --crayon-font-body-large-heavy: ${theme.fontBodyLargeHeavy};
          --crayon-font-body-large-heavy-letter-spacing: ${theme.fontBodyLargeHeavyLetterSpacing};
          --crayon-font-body-large: ${theme.fontBodyLarge};
          --crayon-font-body-large-letter-spacing: ${theme.fontBodyLargeLetterSpacing};

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
    </ThemeContext.Provider>
  );
};
