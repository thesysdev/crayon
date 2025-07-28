// Add at the top of the file
export type ThemeMode = "light" | "dark";

// Color-related theme properties
export interface ColorTheme extends ChartColorPalette {
  // Background colors
  backgroundFills?: string;
  /**
   * @deprecated -- use interactiveAccent instead
   */
  brandElFills?: string;
  /**
   * @deprecated -- use interactiveAccentHover instead
   */
  brandElHoverFills?: string;
  containerFills?: string;
  overlayFills?: string;
  sunkFills?: string;
  /**
   * @deprecated -- use sunkFills instead
   */
  containerHoverFills?: string;
  dangerFills?: string;
  successFills?: string;
  infoFills?: string;
  elevatedFills?: string;
  alertFills?: string;
  sunkBgFills?: string;
  invertedFills?: string;
  // Border colors
  strokeDefault?: string;
  strokeInteractiveEl?: string;
  /**
   * @deprecated -- use strokeEmphasis instead
   */
  strokeInteractiveElHover?: string;
  strokeInteractiveElSelected?: string;
  strokeEmphasis?: string;
  strokeAccent?: string;
  strokeAccentEmphasis?: string;
  strokeInfo?: string;
  strokeInfoEmphasis?: string;
  strokeAlert?: string;
  strokeAlertEmphasis?: string;
  strokeSuccess?: string;
  strokeSuccessEmphasis?: string;
  strokeDanger?: string;
  strokeDangerEmphasis?: string;

  // Text colors
  /**
   * @deprecated -- use accentPrimaryText instead
   */
  brandText?: string;
  /**
   * @deprecated -- use accentSecondaryText instead
   */
  brandSecondaryText?: string;
  primaryText?: string;
  secondaryText?: string;
  disabledText?: string;
  /**
   * @deprecated -- use dangerPrimaryText instead
   */
  dangerText?: string;
  /**
   * @deprecated -- use successPrimaryText instead
   */
  successText?: string;
  linkText?: string;
  /**
   * @deprecated -- use infoPrimaryText instead
   */
  infoText?: string;
  accentPrimaryText?: string;
  accentSecondaryText?: string;
  accentDisabledText?: string;
  successPrimaryText?: string;
  successInvertedText?: string;
  alertPrimaryText?: string;
  alertInvertedText?: string;
  dangerPrimaryText?: string;
  dangerSecondaryText?: string;
  dangerDisabledText?: string;
  dangerInvertedPrimaryText?: string;
  dangerInvertedSecondaryText?: string;
  dangerInvertedDisabledText?: string;
  infoPrimaryText?: string;
  infoInvertedText?: string;

  // Interactive colors
  interactiveDefault?: string;
  interactiveHover?: string;
  interactivePressed?: string;
  interactiveDisabled?: string;
  interactiveAccent?: string;
  interactiveAccentHover?: string;
  interactiveAccentPressed?: string;
  interactiveAccentDisabled?: string;
  interactiveDestructive?: string;
  interactiveDestructiveHover?: string;
  interactiveDestructivePressed?: string;
  interactiveDestructiveDisabled?: string;
  interactiveDestructiveAccent?: string;
  interactiveDestructiveAccentHover?: string;
  interactiveDestructiveAccentPressed?: string;
  interactiveDestructiveAccentDisabled?: string;
  highlightSubtle?: string;

  // chat colors
  chatContainerBg?: string;
  chatAssistantResponseBg?: string;
  chatAssistantResponseText?: string;
  chatUserResponseBg?: string;
  chatUserResponseText?: string;
}

export interface ChartColorPalette {
  defaultChartPalette?: string[];
  barChartPalette?: string[];
  lineChartPalette?: string[];
  areaChartPalette?: string[];
  pieChartPalette?: string[];
  radarChartPalette?: string[];
  radialChartPalette?: string[];
  horizontalBarChartPalette?: string[];
}
// Layout-related theme properties
export interface LayoutTheme {
  // Spacing
  spacing0?: string;
  spacing3xs?: string;
  spacing2xs?: string;
  spacingXs?: string;
  spacingS?: string;
  spacingM?: string;
  spacingL?: string;
  spacingXl?: string;
  spacing2xl?: string;
  spacing3xl?: string;

  // Radius
  rounded0?: string;
  rounded3xs?: string;
  rounded2xs?: string;
  roundedXs?: string;
  roundedS?: string;
  roundedM?: string;
  roundedL?: string;
  roundedXl?: string;
  rounded2xl?: string;
  rounded3xl?: string;
  rounded4xl?: string;
  roundedFull?: string;
  roundedClickable?: string;
}

// Typography-related theme properties
export interface TypographyTheme {
  // Primary Font
  /**
   * @deprecated -- use fontBody instead
   */
  fontPrimary?: string;
  fontPrimaryLetterSpacing?: string;

  // Title Variant
  /**
   * @deprecated -- use fontBodyHeavy instead
   */
  fontTitle?: string;
  fontTitleLetterSpacing?: string;
  /**
   * @deprecated -- use fontBodyLargeHeavy instead
   */
  fontTitleMedium?: string;
  fontTitleMediumLetterSpacing?: string;
  /**
   * @deprecated -- use fontBodySmallHeavy instead
   */
  fontTitleSmall?: string;
  fontTitleSmallLetterSpacing?: string;

  // Body Text
  fontBody?: string;
  fontBodyLetterSpacing?: string;
  fontBodyLink?: string;
  fontBodyLinkLetterSpacing?: string;
  fontBodyHeavy?: string;
  fontBodyHeavyLetterSpacing?: string;
  /**
   * @deprecated -- use fontBody instead
   */
  fontBodyMedium?: string;
  /**
   * @deprecated -- use fontBodyLetterSpacing instead
   */
  fontBodyMediumLetterSpacing?: string;
  fontBodySmallHeavy?: string;
  fontBodySmallHeavyLetterSpacing?: string;
  fontBodySmall?: string;
  fontBodySmallLetterSpacing?: string;
  fontBodyLarge?: string;
  fontBodyLargeLetterSpacing?: string;
  fontBodyLargeHeavy?: string;
  fontBodyLargeHeavyLetterSpacing?: string;
  // Label System
  fontLabel?: string;
  fontLabelLetterSpacing?: string;
  fontLabelHeavy?: string;
  fontLabelHeavyLetterSpacing?: string;
  fontLabelSmall?: string;
  fontLabelSmallLetterSpacing?: string;
  fontLabelSmallHeavy?: string;
  fontLabelSmallHeavyLetterSpacing?: string;
  fontLabelExtraSmall?: string;
  fontLabelExtraSmallLetterSpacing?: string;
  fontLabelExtraSmallHeavy?: string;
  fontLabelExtraSmallHeavyLetterSpacing?: string;
  fontLabelLargeHeavy?: string;
  fontLabelLargeHeavyLetterSpacing?: string;
  fontLabelLarge?: string;
  fontLabelLargeLetterSpacing?: string;
  /**
   * @deprecated -- use fontLabelHeavy instead
   */
  fontLabelMediumHeavy?: string;
  /**
   * @deprecated -- use fontLabelHeavyLetterSpacing instead
   */
  fontLabelMediumHeavyLetterSpacing?: string;
  /**
   * @deprecated -- use fontLabel instead
   */
  fontLabelMedium?: string;
  /**
   * @deprecated -- use fontLabelMediumLetterSpacing instead
   */
  fontLabelMediumLetterSpacing?: string;

  // Headings
  fontHeadingLarge?: string;
  fontHeadingLargeLetterSpacing?: string;
  fontHeadingMedium?: string;
  fontHeadingMediumLetterSpacing?: string;
  fontHeadingSmall?: string;
  fontHeadingSmallLetterSpacing?: string;
  fontHeadingExtraSmall?: string;
  fontHeadingExtraSmallLetterSpacing?: string;

  // 2Extra Small
  fontLabel2ExtraSmall?: string;
  fontLabel2ExtraSmallLetterSpacing?: string;
  fontLabel2ExtraSmallHeavy?: string;
  fontLabel2ExtraSmallHeavyLetterSpacing?: string;

  // Number Font
  fontNumberLarge?: string;
  fontNumberLargeLetterSpacing?: string;
  fontNumberLargeHeavy?: string;
  fontNumberLargeHeavyLetterSpacing?: string;
  fontNumberHeavy?: string;
  fontNumberHeavyLetterSpacing?: string;
  fontNumber?: string;
  fontNumberLetterSpacing?: string;
  fontNumberSmall?: string;
  fontNumberSmallLetterSpacing?: string;
  fontNumberSmallHeavy?: string;
  fontNumberSmallHeavyLetterSpacing?: string;
  fontNumberExtraSmall?: string;
  fontNumberExtraSmallLetterSpacing?: string;
  fontNumberExtraSmallHeavy?: string;
  fontNumberExtraSmallHeavyLetterSpacing?: string;
  fontNumberTitle?: string;
  fontNumberTitleLetterSpacing?: string;
  fontNumberTitleMedium?: string;
  fontNumberTitleMediumLetterSpacing?: string;
}

// Effect-related theme properties
export interface EffectTheme {
  // Shadows
  shadowS?: string;
  shadowM?: string;
  shadowL?: string;
  shadowXl?: string;
  shadow2xl?: string;
  shadow3xl?: string;
}

export interface Theme extends ColorTheme, LayoutTheme, TypographyTheme, EffectTheme {}
