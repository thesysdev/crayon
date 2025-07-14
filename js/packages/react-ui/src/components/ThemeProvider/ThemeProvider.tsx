import React, { createContext, useContext, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useId } from "../../polyfills";
import { ColorTheme, EffectTheme, LayoutTheme, Theme, ThemeMode, TypographyTheme } from "./types";

export type ThemeProps = {
  mode?: ThemeMode;
  children?: React.ReactNode;
  // merged with lightTheme or darkTheme(if darkTheme is not provided)
  theme?: Theme;
  darkTheme?: Theme;
  cssSelector?: string;
};

type ThemeContextType = {
  theme: Theme;
  mode: ThemeMode;
  portalThemeClassName: string;
};

// Update the context to include both theme and mode
export const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

// Update the hook to return both theme and mode
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: themes.light,
      mode: "light",
      portalThemeClassName: "",
    };
  }
  return context;
};

const lightTheme: ColorTheme = {
  // Background colors
  backgroundFills: "rgba(250,250,250,1)",
  containerFills: "rgba(253, 253, 253)",
  overlayFills: "rgba(0, 0, 0, 0.4)",
  sunkFills: "rgba(0, 0, 0, 0.06)",
  dangerFills: "rgba(203,63,73,0.1)",
  successFills: "rgba(13,160,93,0.1)",
  infoFills: "rgba(56, 148, 255, 0.1)",
  alertFills: "rgba(255, 199, 0, 0.1)",
  invertedFills: "rgba(21, 21, 21, 1)",
  elevatedFills: "rgba(255, 255, 255, 0.6)",
  sunkBgFills: "rgba(0, 0, 0, 0.04)",

  // Border colors
  strokeDefault: "rgba(0, 0, 0, 0.04)",
  strokeInteractiveEl: "rgba(0, 0, 0, 0.08)",
  strokeInteractiveElSelected: "rgba(21,21,21,1)",
  strokeEmphasis: "rgba(0, 0, 0, 0.2)",
  strokeAccent: "rgba(255, 255, 255, 0.08)",
  strokeAccentEmphasis: "rgba(255, 255, 255, 0.3)",
  strokeInfo: "rgba(56, 148, 255, 0.08)",
  strokeInfoEmphasis: "rgba(24, 130, 255, 1)",
  strokeAlert: "rgba(255, 199, 0, 0.08)",
  strokeAlertEmphasis: "rgba(255,199,0,1)",
  strokeSuccess: "rgba(13, 160, 94, 0.08)",
  strokeSuccessEmphasis: "rgba(13, 160, 94, 1)",
  strokeDanger: "rgba(203, 63, 73, 0.08)",
  strokeDangerEmphasis: "rgba(200, 44, 55, 1)",

  // Text colors
  primaryText: "rgba(0, 0, 0, 1)",
  secondaryText: "rgba(0, 0, 0, 0.4)",
  disabledText: "rgba(0, 0, 0, 0.2)",
  linkText: "rgba(0, 0, 0, 1)",
  accentPrimaryText: "rgba(255, 255, 255, 1)",
  accentSecondaryText: "rgba(255, 255, 255, 0.4)",
  accentDisabledText: "rgba(255, 255, 255, 0.2)",
  successPrimaryText: "rgba(8,93,58,1)",
  successInvertedText: "rgba(220, 250, 230, 1)",
  alertPrimaryText: "rgba(221, 159, 0, 1)",
  alertInvertedText: "rgba(255, 246, 205, 1)",
  dangerPrimaryText: "rgba(167,39,47,1)",
  dangerSecondaryText: "rgba(203, 63, 73, 1)",
  dangerDisabledText: "rgba(235, 167, 171, 1)",
  dangerInvertedPrimaryText: "rgba(255, 255, 255, 1)",
  dangerInvertedSecondaryText: "rgba(255, 255, 255, 0.4)",
  dangerInvertedDisabledText: "rgba(255, 255, 255, 0.2)",
  infoPrimaryText: "rgba(21,93,177,1)",
  infoInvertedText: "rgba(219, 236, 255, 1)",

  // Interactive colors
  interactiveDefault: "rgba(255, 255, 255, 0.02)",
  interactiveHover: "rgba(0, 0, 0, 0.06)",
  interactivePressed: "rgba(0, 0, 0, 0.04)",
  interactiveDisabled: "rgba(0, 0, 0, 0.02)",
  interactiveAccent: "rgba(0,0,0,1)",
  interactiveAccentHover: "rgba(0,0,0,0.8)",
  // not setting this to make it backward compatible
  // pressed state was not there in the previous version
  // so we are using the hover state as the pressed state
  // interactiveAccentPressed: "rgba(0,0,0,1)",
  interactiveAccentDisabled: "rgba(0,0,0,0.4)",
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
  backgroundFills: "rgba(21,21,21,1)",
  containerFills: "rgba(28,28,28,1)",
  overlayFills: "rgba(0, 0, 0, 0.4)",
  sunkFills: "rgba(255,255,255,0.08)",
  dangerFills: "rgba(203,63,73,0.2)",
  successFills: "rgba(13,160, 94, 0.2)",
  infoFills: "rgba(56, 148, 255, 0.2)",
  alertFills: "rgba(255, 199, 0, 0.2)",
  elevatedFills: "rgba(255, 255, 255, 0.06)",
  invertedFills: "rgba(253, 253, 253, 1)",
  sunkBgFills: "rgba(0, 0, 0, 0.16)",

  // Border colors
  strokeDefault: "rgba(255, 255, 255, 0.04)",
  strokeInteractiveEl: "rgba(255, 255, 255, 0.1)",
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
  primaryText: "rgba(255, 255, 255, 1)",
  secondaryText: "rgba(255, 255, 255, 0.4)",
  disabledText: "rgba(255, 255, 255, 0.2)",
  linkText: "rgba(255, 255, 255, 1)",
  accentPrimaryText: "rgba(0,0,0,1)",
  accentSecondaryText: "rgba(0,0,0,0.4)",
  accentDisabledText: "rgba(0,0,0,0.2)",
  successPrimaryText: "rgba(23,178,106,1)",
  successInvertedText: "rgba(2, 79, 48, 1)",
  alertPrimaryText: "rgba(243, 207, 80, 1)",
  alertInvertedText: "rgba(187, 122, 0, 1)",
  dangerPrimaryText: " rgba(203,63,73,1)",
  dangerSecondaryText: "rgba(167, 39, 47, 1)",
  dangerDisabledText: "rgba(130, 26, 32, 1)",
  dangerInvertedPrimaryText: "rgba(255, 255, 255, 1)",
  dangerInvertedSecondaryText: "rgba(255, 255, 255, 0.4)",
  dangerInvertedDisabledText: "rgba(255, 255, 255, 0.2)",
  infoPrimaryText: "rgba(70,160,247,1)",
  infoInvertedText: "rgba(13, 75, 148, 1)",

  // Interactive colors
  interactiveDefault: "rgba(0, 0, 0, 0.02)",
  interactiveHover: "rgba(255, 255, 255, 0.06)",
  interactivePressed: "rgba(255, 255, 255, 0.04)",
  interactiveDisabled: "rgba(255, 255, 255, 0.02)",
  interactiveAccent: "rgba(255,255,255,1)",
  interactiveAccentHover: "rgba(255,255,255,0.8)",
  interactiveAccentPressed: "rgba(255,255,255, 1)",
  interactiveAccentDisabled: "rgba(255, 255, 255, 0.4)",
  interactiveDestructive: "rgba(203, 63, 73, 0.04)",
  interactiveDestructiveHover: "rgba(203, 63, 73, 0.1)",
  interactiveDestructivePressed: "rgba(203, 63, 73, 0.2)",
  interactiveDestructiveDisabled: "rgba(203, 63, 73, 0.04)",
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
  // fontPrimary: '400 16px/20px "Inter"',
  // fontPrimaryLetterSpacing: "0px",

  // Display & Headings
  // Large
  fontHeadingLarge: '600 28px/1.15 "Inter"',
  fontHeadingLargeLetterSpacing: "-0.75px",
  // Medium
  fontHeadingMedium: '600 24px/1.15 "Inter"',
  fontHeadingMediumLetterSpacing: "-0.75px",
  // Small
  fontHeadingSmall: '500 18px/1.25 "Inter"',
  fontHeadingSmallLetterSpacing: "-0.25px",
  // Extra Small
  fontHeadingExtraSmall: '500 16px/1.25 "Inter"',
  fontHeadingExtraSmallLetterSpacing: "0px",

  // Title Variants
  // Default
  // fontTitle: '500 16px/20px "Inter"',
  // fontTitleLetterSpacing: "0px",
  // Medium
  // fontTitleMedium: '500 16px/20px "Inter"',
  // fontTitleMediumLetterSpacing: "0px",
  // Small
  // fontTitleSmall: '500 16px/20px "Inter"',
  // fontTitleSmallLetterSpacing: "0px",

  // Body Text
  // Regular
  fontBody: '400 16px/1.5 "Inter"',
  fontBodyLetterSpacing: "0px",

  // fontBodyMedium: '400 16px/20px "Inter"',
  // fontBodyMediumLetterSpacing: "0px",

  fontBodySmall: '400 14px/1.5 "Inter"',
  fontBodySmallLetterSpacing: "0px",

  // Heavy
  fontBodyHeavy: '500 16px/1.5 "Inter"',
  fontBodyHeavyLetterSpacing: "0px",

  fontBodySmallHeavy: '500 14px/1.5 "Inter"',
  fontBodySmallHeavyLetterSpacing: "0px",

  // Special
  fontBodyLink: '400 16px/1.5 "Inter"',
  fontBodyLinkLetterSpacing: "0px",

  fontBodyLarge: '400 18px/1.5 "Inter"',
  fontBodyLargeLetterSpacing: "0px",

  fontBodyLargeHeavy: '500 18px/1.5 "Inter"',
  fontBodyLargeHeavyLetterSpacing: "0px",

  // Label System
  // Large
  fontLabelLarge: '400 18px/1.2 "Inter"',
  fontLabelLargeLetterSpacing: "0px",

  fontLabelLargeHeavy: '500 18px/1.2 "Inter"',
  fontLabelLargeHeavyLetterSpacing: "0px",
  // Regular
  fontLabel: '400 16px/1.2 "Inter"',
  fontLabelLetterSpacing: "0px",

  fontLabelHeavy: '500 16px/1.2 "Inter"',
  fontLabelHeavyLetterSpacing: "0px",
  // Medium
  // fontLabelMedium: '400 16px/20px "Inter"',
  // fontLabelMediumLetterSpacing: "0px",

  // fontLabelMediumHeavy: '600 16px/20px "Inter"',
  // fontLabelMediumHeavyLetterSpacing: "0px",
  // Small
  fontLabelSmall: '400 14px/1.2 "Inter"',
  fontLabelSmallLetterSpacing: "0px",

  fontLabelSmallHeavy: '500 14px/1.2 "Inter"',
  fontLabelSmallHeavyLetterSpacing: "0px",
  // Extra Small
  fontLabelExtraSmall: '400 12px/1.2 "Inter"',
  fontLabelExtraSmallLetterSpacing: "0px",

  fontLabelExtraSmallHeavy: '500 12px/1.2 "Inter"',
  fontLabelExtraSmallHeavyLetterSpacing: "0px",

  // 2Extra Small
  fontLabel2ExtraSmall: '400 10px/1.2 "Inter"',
  fontLabel2ExtraSmallLetterSpacing: "0px",

  fontLabel2ExtraSmallHeavy: '500 10px/1.2 "Inter"',
  fontLabel2ExtraSmallHeavyLetterSpacing: "0px",
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
  cssSelector = "body",
}: ThemeProps) => {
  const id = useId();
  const baseTheme = themes[mode];
  const lightTheme = useShallow(() => ({ ...baseTheme, ...userTheme }))(undefined);
  const darkTheme = useShallow(() => ({ ...baseTheme, ...(userDarkTheme || userTheme) }))(
    undefined,
  );

  const theme = mode === "light" ? lightTheme : darkTheme;
  const contextValue = useMemo(
    () => ({ theme, mode, portalThemeClassName: `crayon-theme-portal-${id}` }),
    [theme, mode, id],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <style>{`
        ${cssSelector}, .${contextValue.portalThemeClassName} {
          --crayon-background-fills: ${theme.backgroundFills};
          --crayon-brand-el-fills: ${theme.brandElFills};
          --crayon-brand-el-hover-fills: ${theme.brandElHoverFills};
          --crayon-container-fills: ${theme.containerFills};
          --crayon-overlay-fills: ${theme.overlayFills};
          --crayon-sunk-fills: ${theme.sunkFills};
          --crayon-container-hover-fills: ${theme.containerHoverFills};
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
          --crayon-interactive-accent: ${theme.brandElFills || theme.interactiveAccent};
          --crayon-interactive-accent-hover: ${theme.brandElHoverFills || theme.interactiveAccentHover};
          --crayon-interactive-accent-pressed: ${theme.brandElHoverFills || theme.interactiveAccentPressed || theme.interactiveAccentHover};
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
          --crayon-stroke-interactive-el-hover: ${theme.strokeInteractiveElHover};
          --crayon-stroke-interactive-el-selected: ${theme.strokeInteractiveElSelected};
          --crayon-stroke-emphasis: ${theme.strokeInteractiveElHover || theme.strokeEmphasis};
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

          --crayon-brand-text: ${theme.brandText};
          --crayon-brand-secondary-text: ${theme.brandSecondaryText};
          --crayon-primary-text: ${theme.primaryText};
          --crayon-secondary-text: ${theme.secondaryText};
          --crayon-disabled-text: ${theme.disabledText};
          --crayon-danger-text: ${theme.dangerText};
          --crayon-success-text: ${theme.successText};
          --crayon-link-text: ${theme.linkText};
          --crayon-info-text: ${theme.infoText};
          --crayon-accent-primary-text: ${theme.brandText || theme.accentPrimaryText};
          --crayon-accent-secondary-text: ${theme.brandSecondaryText || theme.accentSecondaryText};
          --crayon-accent-disabled-text: ${theme.accentDisabledText};
          --crayon-success-primary-text: ${theme.successText || theme.successPrimaryText};
          --crayon-success-inverted-text: ${theme.successInvertedText};
          --crayon-alert-primary-text: ${theme.alertPrimaryText};
          --crayon-alert-inverted-text: ${theme.alertInvertedText};
          --crayon-danger-primary-text: ${theme.dangerText || theme.dangerPrimaryText};
          --crayon-danger-secondary-text: ${theme.dangerSecondaryText};
          --crayon-danger-disabled-text: ${theme.dangerDisabledText};
          --crayon-danger-inverted-primary-text: ${theme.dangerInvertedPrimaryText};
          --crayon-danger-inverted-secondary-text: ${theme.dangerInvertedSecondaryText};
          --crayon-danger-inverted-disabled-text: ${theme.dangerInvertedDisabledText};
          --crayon-info-primary-text: ${theme.infoText || theme.infoPrimaryText};
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

          --crayon-font-primary: ${theme.fontPrimary || theme.fontBody};
          --crayon-font-primary-letter-spacing: ${theme.fontPrimaryLetterSpacing};
          --crayon-font-title: ${theme.fontTitle || theme.fontBodyHeavy};
          --crayon-font-title-letter-spacing: ${theme.fontTitleLetterSpacing || theme.fontBodyHeavyLetterSpacing};
          --crayon-font-title-medium: ${theme.fontTitleMedium || theme.fontBodyLargeHeavy};
          --crayon-font-title-medium-letter-spacing: ${theme.fontTitleMediumLetterSpacing || theme.fontBodyLargeHeavyLetterSpacing};
          --crayon-font-title-small: ${theme.fontTitleSmall || theme.fontBodySmallHeavy};
          --crayon-font-title-small-letter-spacing: ${theme.fontTitleSmallLetterSpacing || theme.fontBodySmallHeavyLetterSpacing};
          --crayon-font-body: ${theme.fontBody};
          --crayon-font-body-letter-spacing: ${theme.fontBodyLetterSpacing};
          --crayon-font-body-link: ${theme.fontBodyLink};
          --crayon-font-body-link-letter-spacing: ${theme.fontBodyLinkLetterSpacing};
          --crayon-font-body-heavy: ${theme.fontBodyHeavy};
          --crayon-font-body-heavy-letter-spacing: ${theme.fontBodyHeavyLetterSpacing};
          --crayon-font-body-medium: ${theme.fontBodyMedium || theme.fontBody};
          --crayon-font-body-medium-letter-spacing: ${theme.fontBodyMediumLetterSpacing || theme.fontBodyLetterSpacing};
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
          --crayon-font-label-medium-heavy: ${theme.fontLabelMediumHeavy || theme.fontLabelHeavy};
          --crayon-font-label-medium-heavy-letter-spacing: ${theme.fontLabelMediumHeavyLetterSpacing || theme.fontLabelHeavyLetterSpacing};
          --crayon-font-label-medium: ${theme.fontLabelMedium || theme.fontLabel};
          --crayon-font-label-medium-letter-spacing: ${theme.fontLabelMediumLetterSpacing || theme.fontLabelLetterSpacing};
          --crayon-font-heading-large: ${theme.fontHeadingLarge};
          --crayon-font-heading-large-letter-spacing: ${theme.fontHeadingLargeLetterSpacing};
          --crayon-font-heading-medium: ${theme.fontHeadingMedium};
          --crayon-font-heading-medium-letter-spacing: ${theme.fontHeadingMediumLetterSpacing};
          --crayon-font-heading-small: ${theme.fontHeadingSmall};
          --crayon-font-heading-small-letter-spacing: ${theme.fontHeadingSmallLetterSpacing};
          --crayon-font-heading-extra-small: ${theme.fontHeadingExtraSmall};
          --crayon-font-heading-extra-small-letter-spacing: ${theme.fontHeadingExtraSmallLetterSpacing};
          --crayon-font-body-large-heavy: ${theme.fontBodyLargeHeavy};
          --crayon-font-body-large-heavy-letter-spacing: ${theme.fontBodyLargeHeavyLetterSpacing};
          --crayon-font-body-large: ${theme.fontBodyLarge};
          --crayon-font-body-large-letter-spacing: ${theme.fontBodyLargeLetterSpacing};
          --crayon-font-label-2-extra-small: ${theme.fontLabel2ExtraSmall};
          --crayon-font-label-2-extra-small-letter-spacing: ${theme.fontLabel2ExtraSmallLetterSpacing};
          --crayon-font-label-2-extra-small-heavy: ${theme.fontLabel2ExtraSmallHeavy};
          --crayon-font-label-2-extra-small-heavy-letter-spacing: ${theme.fontLabel2ExtraSmallHeavyLetterSpacing};

          --crayon-shadow-s: ${theme.shadowS};
          --crayon-shadow-m: ${theme.shadowM};
          --crayon-shadow-l: ${theme.shadowL};
          --crayon-shadow-xl: ${theme.shadowXl};
          --crayon-shadow-2xl: ${theme.shadow2xl};
          --crayon-shadow-3xl: ${theme.shadow3xl};

          --crayon-chat-container-bg: ${theme.chatContainerBg || theme.backgroundFills};
          --crayon-chat-assistant-response-bg: ${theme.chatAssistantResponseBg || theme.containerFills};
          --crayon-chat-assistant-response-text: ${theme.chatAssistantResponseText || theme.primaryText};
          --crayon-chat-user-response-bg: ${theme.chatUserResponseBg || theme.brandElFills || theme.interactiveAccent};
          --crayon-chat-user-response-text: ${theme.chatUserResponseText || theme.brandText || theme.accentPrimaryText};
        }
      `}</style>
      {children}
    </ThemeContext.Provider>
  );
};
