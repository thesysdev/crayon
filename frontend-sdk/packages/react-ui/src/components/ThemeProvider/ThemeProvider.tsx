interface ThemeProviderProps {
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

  // Border colors
  strokesDefault?: string;
  stocksInteractiveEl?: string;
  stocksInteractiveElHover?: string;
  strokesInteractiveElSelected?: string;

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

  // Font styles
  fontPrimary?: string;
  fontPrimaryLetterSpacing?: string;
  fontTitle?: string;
  fontTitleLetterSpacing?: string;
  fontTitleMedium?: string;
  fontTitleMediumLetterSpacing?: string;
  fontTitleSmall?: string;
  fontTitleSmallLetterSpacing?: string;
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
  fontHeadingLarge?: string;
  fontHeadingLargeLetterSpacing?: string;
  fontHeadingMedium?: string;
  fontHeadingMediumLetterSpacing?: string;
  fontHeadingSmall?: string;
  fontHeadingSmallLetterSpacing?: string;

  // Shadows
  shadowS?: string;
  shadowM?: string;
  shadowL?: string;
  shadowXl?: string;
  shadow2xl?: string;
  shadow3xl?: string;
}

const defaultTheme: ThemeProviderProps = {
  // Background colors
  backgroundFills: "rgb(245, 245, 245)",
  brandElFills: "rgb(0, 0, 0)",
  brandElHoverFills: "rgba(0, 0, 0, 0.8)",
  containerFills: "rgb(255, 255, 255)",
  overlayFills: "rgba(0, 0, 0, 0.4)",
  sunkFills: "rgba(0, 0, 0, 0.04)",
  containerHoverFills: "rgba(0, 0, 0, 0.04)",
  dangerFills: "rgba(217, 45, 32, 0.08)",
  successFills: "rgba(7, 148, 85, 0.08)",

  // Border colors
  strokesDefault: "rgba(0, 0, 0, 0.06)",
  stocksInteractiveEl: "rgba(0, 0, 0, 0.12)",
  stocksInteractiveElHover: "rgba(0, 0, 0, 0.4)",
  strokesInteractiveElSelected: "rgba(0, 0, 0, 1)",

  // Text colors
  brandText: "rgba(255, 255, 255, 1)",
  brandSecondaryText: "rgba(255, 255, 255, 0.4)",
  primaryText: "rgba(0, 0, 0, 1)",
  secondaryText: "rgba(0, 0, 0, 0.4)",
  disabledText: "rgba(0, 0, 0, 0.2)",
  dangerText: "rgba(217, 45, 32, 1)",
  successText: "rgba(217, 45, 32, 1)",
  linkText: "rgba(0, 0, 0, 1)",
  infoText: "rgba(0, 0, 0, 0.4)",

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

  // Primary Font
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

  // Shadows
  shadowS: "0px 2px 4px -2px rgba(0, 0, 0, 0.04), 0px 1px 2px -2px rgba(0, 0, 0, 0.02)",
  shadowM: "0px 2px 2px -2px rgba(0, 0, 0, 0.05), 0px 4px 6px -2px rgba(0, 0, 0, 0.03)",
  shadowL: "0px 4px 4px -2px rgba(0, 0, 0, 0.05), 0px 4px 8px -2px rgba(0, 0, 0, 0.04)",
  shadowXl: "0px 6px 8px -4px rgba(0, 0, 0, 0.12), 0px 4px 20px -6px rgba(0, 0, 0, 0.08)",
  shadow2xl: "0px 6px 10px -6px rgba(0, 0, 0, 0.14), 0px 8px 32px -6px rgba(0, 0, 0, 0.12)",
  shadow3xl: "0px 12px 24px -4px rgba(0, 0, 0, 0.14), 0px 16px 32px -6px rgba(0, 0, 0, 0.12)",
};

export const ThemeProvider = (props: React.PropsWithChildren<ThemeProviderProps>) => {
  const theme = { ...defaultTheme, ...props };

  return (
    <>
      <style>{`
      body {
        --background-fills: ${theme.backgroundFills};
        --brand-el-fills: ${theme.brandElFills};
        --brand-el-hover-fills: ${theme.brandElHoverFills};
        --container-fills: ${theme.containerFills};
        --overlay-fills: ${theme.overlayFills};
        --sunk-fills: ${theme.sunkFills};
        --container-hover-fills: ${theme.containerHoverFills};
        --danger-fills: ${theme.dangerFills};
        --success-fills: ${theme.successFills};

        --strokes-default: ${theme.strokesDefault};
        --stocks-interactive-el: ${theme.stocksInteractiveEl};
        --stocks-interactive-el-hover: ${theme.stocksInteractiveElHover};
        --strokes-interactive-el-selected: ${theme.strokesInteractiveElSelected};

        --brand-text: ${theme.brandText};
        --brand-secondary-text: ${theme.brandSecondaryText};
        --primary-text: ${theme.primaryText};
        --secondary-text: ${theme.secondaryText};
        --disabled-text: ${theme.disabledText};
        --danger-text: ${theme.dangerText};
        --success-text: ${theme.successText};
        --link-text: ${theme.linkText};
        --info-text: ${theme.infoText};

        --spacing-0: ${theme.spacing0};
        --spacing-3xs: ${theme.spacing3xs};
        --spacing-2xs: ${theme.spacing2xs};
        --spacing-xs: ${theme.spacingXs};
        --spacing-s: ${theme.spacingS};
        --spacing-m: ${theme.spacingM};
        --spacing-l: ${theme.spacingL};
        --spacing-xl: ${theme.spacingXl};
        --spacing-2xl: ${theme.spacing2xl};
        --spacing-3xl: ${theme.spacing3xl};

        --rounded-0: ${theme.rounded0};
        --rounded-3xs: ${theme.rounded3xs};
        --rounded-2xs: ${theme.rounded2xs};
        --rounded-xs: ${theme.roundedXs};
        --rounded-s: ${theme.roundedS};
        --rounded-m: ${theme.roundedM};
        --rounded-l: ${theme.roundedL};
        --rounded-xl: ${theme.roundedXl};
        --rounded-2xl: ${theme.rounded2xl};
        --rounded-3xl: ${theme.rounded3xl};
        --rounded-full: ${theme.roundedFull};

        --font-primary: ${theme.fontPrimary};
        --font-primary-letter-spacing: ${theme.fontPrimaryLetterSpacing};
        --font-title: ${theme.fontTitle};
        --font-title-letter-spacing: ${theme.fontTitleLetterSpacing};
        --font-title-medium: ${theme.fontTitleMedium};
        --font-title-medium-letter-spacing: ${theme.fontTitleMediumLetterSpacing};
        --font-title-small: ${theme.fontTitleSmall};
        --font-title-small-letter-spacing: ${theme.fontTitleSmallLetterSpacing};
        --font-body: ${theme.fontBody};
        --font-body-letter-spacing: ${theme.fontBodyLetterSpacing};
        --font-body-link: ${theme.fontBodyLink};
        --font-body-link-letter-spacing: ${theme.fontBodyLinkLetterSpacing};
        --font-body-heavy: ${theme.fontBodyHeavy};
        --font-body-heavy-letter-spacing: ${theme.fontBodyHeavyLetterSpacing};
        --font-body-medium: ${theme.fontBodyMedium};
        --font-body-medium-letter-spacing: ${theme.fontBodyMediumLetterSpacing};
        --font-body-small-heavy: ${theme.fontBodySmallHeavy};
        --font-body-small-heavy-letter-spacing: ${theme.fontBodySmallHeavyLetterSpacing};
        --font-body-small: ${theme.fontBodySmall};
        --font-body-small-letter-spacing: ${theme.fontBodySmallLetterSpacing};
        --font-label: ${theme.fontLabel};
        --font-label-letter-spacing: ${theme.fontLabelLetterSpacing};
        --font-label-heavy: ${theme.fontLabelHeavy};
        --font-label-heavy-letter-spacing: ${theme.fontLabelHeavyLetterSpacing};
        --font-label-small: ${theme.fontLabelSmall};
        --font-label-small-letter-spacing: ${theme.fontLabelSmallLetterSpacing};
        --font-label-small-heavy: ${theme.fontLabelSmallHeavy};
        --font-label-small-heavy-letter-spacing: ${theme.fontLabelSmallHeavyLetterSpacing};
        --font-label-extra-small: ${theme.fontLabelExtraSmall};
        --font-label-extra-small-letter-spacing: ${theme.fontLabelExtraSmallLetterSpacing};
        --font-label-extra-small-heavy: ${theme.fontLabelExtraSmallHeavy};
        --font-label-extra-small-heavy-letter-spacing: ${theme.fontLabelExtraSmallHeavyLetterSpacing};
        --font-label-large-heavy: ${theme.fontLabelLargeHeavy};
        --font-label-large-heavy-letter-spacing: ${theme.fontLabelLargeHeavyLetterSpacing};
        --font-label-large: ${theme.fontLabelLarge};
        --font-label-large-letter-spacing: ${theme.fontLabelLargeLetterSpacing};
        --font-label-medium-heavy: ${theme.fontLabelMediumHeavy};
        --font-label-medium-heavy-letter-spacing: ${theme.fontLabelMediumHeavyLetterSpacing};
        --font-label-medium: ${theme.fontLabelMedium};
        --font-label-medium-letter-spacing: ${theme.fontLabelMediumLetterSpacing};
        --font-heading-large: ${theme.fontHeadingLarge};
        --font-heading-large-letter-spacing: ${theme.fontHeadingLargeLetterSpacing};
        --font-heading-medium: ${theme.fontHeadingMedium};
        --font-heading-medium-letter-spacing: ${theme.fontHeadingMediumLetterSpacing};
        --font-heading-small: ${theme.fontHeadingSmall};
        --font-heading-small-letter-spacing: ${theme.fontHeadingSmallLetterSpacing};

        --shadow-s: ${theme.shadowS};
        --shadow-m: ${theme.shadowM};
        --shadow-l: ${theme.shadowL};
        --shadow-xl: ${theme.shadowXl};
        --shadow-2xl: ${theme.shadow2xl};
        --shadow-3xl: ${theme.shadow3xl};
      }
    `}</style>
      {props.children}
    </>
  );
};
