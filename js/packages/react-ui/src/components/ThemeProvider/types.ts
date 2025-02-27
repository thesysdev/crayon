// Add at the top of the file
export type ThemeMode = "light" | "dark";

// Color-related theme properties
export interface ColorTheme {
  // Background colors
  backgroundFills?: string;
  brandElFills?: string;
  brandElHoverFills?: string;
  containerFills?: string;
  overlayFills?: string;
  sunkFills?: string;
  containerHoverFills?: string;
  dangerFills?: string;
  successFills?: string;
  infoFills?: string;
  elevatedFills?: string;
  // Border colors
  strokeDefault?: string;
  strokeInteractiveEl?: string;
  strokeInteractiveElHover?: string;
  strokeInteractiveElSelected?: string;

  // Text colors
  brandText?: string;
  brandSecondaryText?: string;
  primaryText?: string;
  secondaryText?: string;
  disabledText?: string;
  dangerText?: string;
  successText?: string;
  linkText?: string;
  infoText?: string;

  // chat colors
  chatContainerBg?: string;
  chatAssistantResponseBg?: string;
  chatAssistantResponseText?: string;
  chatUserResponseBg?: string;
  chatUserResponseText?: string;
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
  fontPrimary?: string;
  fontPrimaryLetterSpacing?: string;

  // Title Variants
  fontTitle?: string;
  fontTitleLetterSpacing?: string;
  fontTitleMedium?: string;
  fontTitleMediumLetterSpacing?: string;
  fontTitleSmall?: string;
  fontTitleSmallLetterSpacing?: string;

  // Body Text
  fontBody?: string;
  fontBodyLetterSpacing?: string;
  fontBodyLink?: string;
  fontBodyLinkLetterSpacing?: string;
  fontBodyHeavy?: string;
  fontBodyHeavyLetterSpacing?: string;
  fontBodyMedium?: string;
  fontBodyMediumLetterSpacing?: string;
  fontBodySmallHeavy?: string;
  fontBodySmallHeavyLetterSpacing?: string;
  fontBodySmall?: string;
  fontBodySmallLetterSpacing?: string;

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
  fontLabelMediumHeavy?: string;
  fontLabelMediumHeavyLetterSpacing?: string;
  fontLabelMedium?: string;
  fontLabelMediumLetterSpacing?: string;

  // Headings
  fontHeadingLarge?: string;
  fontHeadingLargeLetterSpacing?: string;
  fontHeadingMedium?: string;
  fontHeadingMediumLetterSpacing?: string;
  fontHeadingSmall?: string;
  fontHeadingSmallLetterSpacing?: string;
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
