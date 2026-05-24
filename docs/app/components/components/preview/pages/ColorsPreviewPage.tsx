import {
  ColorSwatchesPreviewSection,
  ColorTokenTable,
  PreviewPage,
  PreviewSection,
} from "@components/components/preview";
import tableStyles from "@components/components/preview/FoundationTokenTable.module.css";

const surfaceItems = [
  { token: "--openui-background", useCase: "Page and canvas backgrounds." },
  { token: "--openui-foreground", useCase: "Card and container surfaces." },
  { token: "--openui-popover-background", useCase: "Floating surfaces like popovers and menus." },
  { token: "--openui-sunk", useCase: "Inset areas and subtle pressed backgrounds." },
  { token: "--openui-elevated", useCase: "Raised layers and elevated fills." },
  { token: "--openui-overlay", useCase: "Backdrop overlays behind modals and drawers." },
  { token: "--openui-highlight", useCase: "Hover emphasis on neutral surfaces." },
  { token: "--openui-inverted-background", useCase: "High-contrast inverse surface." },
  { token: "--openui-info-background", useCase: "Informational status backgrounds." },
  { token: "--openui-success-background", useCase: "Success status backgrounds." },
  { token: "--openui-alert-background", useCase: "Warning status backgrounds." },
  { token: "--openui-danger-background", useCase: "Danger and error status backgrounds." },
  { token: "--openui-purple-background", useCase: "Purple semantic backgrounds." },
  { token: "--openui-pink-background", useCase: "Pink semantic backgrounds." },
];

const textItems = [
  { token: "--openui-text-neutral-primary", useCase: "Primary readable text." },
  { token: "--openui-text-neutral-secondary", useCase: "Secondary descriptive copy." },
  { token: "--openui-text-neutral-tertiary", useCase: "Subtle helper text." },
  { token: "--openui-text-neutral-link", useCase: "Default link text." },
  { token: "--openui-text-brand", useCase: "Brand-colored text accents." },
  { token: "--openui-text-accent-primary", useCase: "Primary text on accent backgrounds." },
  { token: "--openui-text-accent-secondary", useCase: "Secondary text on accent backgrounds." },
  { token: "--openui-text-accent-tertiary", useCase: "Tertiary text on accent backgrounds." },
  { token: "--openui-text-white", useCase: "Explicit white text utility." },
  { token: "--openui-text-black", useCase: "Explicit black text utility." },
];

const interactiveBrandItems = [
  { token: "--openui-interactive-accent-default", useCase: "Primary accent action default fill." },
  { token: "--openui-interactive-accent-hover", useCase: "Primary accent action hover fill." },
  { token: "--openui-interactive-accent-pressed", useCase: "Primary accent action pressed fill." },
  {
    token: "--openui-interactive-accent-disabled",
    useCase: "Primary accent action disabled fill.",
  },
];

const interactiveDestructiveItems = [
  {
    token: "--openui-interactive-destructive-accent-default",
    useCase: "Destructive action default fill.",
  },
  {
    token: "--openui-interactive-destructive-accent-hover",
    useCase: "Destructive action hover fill.",
  },
  {
    token: "--openui-interactive-destructive-accent-pressed",
    useCase: "Destructive action pressed fill.",
  },
  {
    token: "--openui-interactive-destructive-accent-disabled",
    useCase: "Destructive action disabled fill.",
  },
];

const borderItems = [
  { token: "--openui-border-default", useCase: "Default outlines and separators." },
  { token: "--openui-border-interactive", useCase: "Interactive element borders." },
  { token: "--openui-border-interactive-emphasis", useCase: "High emphasis outlines." },
  { token: "--openui-border-interactive-selected", useCase: "Selected state borders." },
  { token: "--openui-border-accent", useCase: "Accent borders and outlines." },
  { token: "--openui-border-accent-emphasis", useCase: "High-emphasis accent borders." },
  { token: "--openui-border-info", useCase: "Info border state." },
  { token: "--openui-border-info-emphasis", useCase: "Info-emphasis border state." },
  { token: "--openui-border-alert", useCase: "Alert border state." },
  { token: "--openui-border-alert-emphasis", useCase: "Alert-emphasis border state." },
  { token: "--openui-border-success", useCase: "Success border state." },
  { token: "--openui-border-success-emphasis", useCase: "Success-emphasis border state." },
  { token: "--openui-border-danger", useCase: "Danger border state." },
  { token: "--openui-border-danger-emphasis", useCase: "Danger-emphasis border state." },
];

const swatchScale = [25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 925, 950, 1000];
const swatchFamilies = [
  "neutral",
  "slate",
  "gray",
  "zinc",
  "stone",
  "blue",
  "sky",
  "cyan",
  "teal",
  "emerald",
  "lime",
  "amber",
  "orange",
  "green",
  "yellow",
  "red",
  "purple",
  "violet",
  "fuchsia",
  "pink",
];

const alphaScale = [
  "a02",
  "a04",
  "a06",
  "a08",
  "a10",
  "a12",
  "a20",
  "a30",
  "a40",
  "a50",
  "a60",
  "a70",
  "a80",
  "a90",
  "a100",
];
const familyAlphaScale = [
  "a02",
  "a04",
  "a06",
  "a08",
  "a10",
  "a12",
  "a20",
  "a30",
  "a40",
  "a50",
  "a60",
  "a70",
  "a80",
  "a90",
  "a100",
];
const toTitleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const familyTitleByFamily: Record<string, string> = {
  gray: "Steel",
  zinc: "Iron",
  stone: "Graphite",
};
const familyAlphaBaseByFamily: Record<string, number> = {
  neutral: 1000,
  slate: 1000,
  gray: 1000,
  zinc: 1000,
  stone: 1000,
};

const buildPaletteRow = (family: string) => ({
  id: `swatch-${family}`,
  title: familyTitleByFamily[family] ?? toTitleCase(family),
  tokens: swatchScale.map((step) => `--swatch-${family}-${step}`),
});
const buildFamilyAlphaRow = (family: string) => ({
  id: `swatch-alpha-${family}`,
  title: `${familyTitleByFamily[family] ?? toTitleCase(family)} alpha`,
  tokens: familyAlphaScale.map(
    (step) => `--swatch-${family}-${familyAlphaBaseByFamily[family] ?? 600}-${step}`,
  ),
});

const colorSwatchRows = [
  ...swatchFamilies.flatMap((family) => [buildPaletteRow(family), buildFamilyAlphaRow(family)]),
  {
    id: "swatch-alpha-black",
    title: "Black alpha",
    tokens: alphaScale.map((step) => `--swatch-black-${step}`),
  },
  {
    id: "swatch-alpha-white",
    title: "White alpha",
    tokens: alphaScale.map((step) => `--swatch-white-${step}`),
  },
];

export default function ColorsPreviewPage() {
  return (
    <PreviewPage>
      <PreviewSection
        id="foundation"
        title="Colors"
        headingLevel="h1"
        description="Foundation palette and semantic color tokens for surfaces, text, interactive states, and strokes."
      />

      <PreviewSection
        title="Surface"
        description="Surface tokens establish depth, contrast, and baseline backgrounds."
      >
        <ColorTokenTable items={surfaceItems} />
        <div className={tableStyles.foundationComponentsPlaceholder}>
          Surface components preview coming soon.
        </div>
      </PreviewSection>

      <PreviewSection
        title="Text"
        description="Text tokens support hierarchy and semantic messaging states."
      >
        <ColorTokenTable items={textItems} />
        <div className={tableStyles.foundationComponentsPlaceholder}>
          Text components preview coming soon.
        </div>
      </PreviewSection>

      <PreviewSection
        title="Accent"
        description="Accent interaction tokens define visual states for primary actions."
      >
        <ColorTokenTable items={interactiveBrandItems} />
        <div className={tableStyles.foundationComponentsPlaceholder}>
          Accent components preview coming soon.
        </div>
      </PreviewSection>

      <PreviewSection
        title="Destructive"
        description="Destructive interaction tokens define visual states for destructive actions."
      >
        <ColorTokenTable items={interactiveDestructiveItems} />
        <div className={tableStyles.foundationComponentsPlaceholder}>
          Destructive components preview coming soon.
        </div>
      </PreviewSection>

      <PreviewSection
        title="Stroke"
        description="Stroke tokens define default and semantic borders across components."
      >
        <ColorTokenTable items={borderItems} />
        <div className={tableStyles.foundationComponentsPlaceholder}>
          Stroke components preview coming soon.
        </div>
      </PreviewSection>

      <ColorSwatchesPreviewSection
        id="swatches"
        title="Color swatches"
        description="Complete swatch palette shown below the semantic variable tokens."
        rows={colorSwatchRows}
      />
    </PreviewPage>
  );
}
