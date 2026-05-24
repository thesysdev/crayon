# ThemeProvider

Wraps your application and injects `--openui-*` CSS custom properties into `<head>` via React 18's `useInsertionEffect`. These variables are consumed by `cssUtils.scss` SCSS variables and the `typography()` mixin, making every OpenUI component theme-aware with zero extra configuration.

```
Theme object ──► ThemeProvider ──► useInsertionEffect ──► <style> in <head>
                                                              │
                                                  cssUtils.scss ($background, $text-neutral-primary, …)
                                                              │
                                                         Component SCSS
```

Components render correctly **without** a ThemeProvider because `cssUtils.scss` is auto-generated at build time with fallback values from `defaultLightTheme`. The provider overrides those fallbacks when mounted.

## Quick Start

```tsx
import { ThemeProvider } from "@openuidev/react-ui";

function App() {
  return (
    <ThemeProvider mode="light">
      <YourApp />
    </ThemeProvider>
  );
}
```

Switch to dark mode by changing the `mode` prop:

```tsx
<ThemeProvider mode="dark">
  <YourApp />
</ThemeProvider>
```

## Props

| Prop          | Type                | Default   | Description                                                                                                                     |
| ------------- | ------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `mode`        | `"light" \| "dark"` | `"light"` | Active color scheme                                                                                                             |
| `lightTheme`  | `Theme`             | `{}`      | Partial overrides merged onto the built-in light defaults. Recommended over the deprecated `theme` prop.                        |
| `darkTheme`   | `Theme`             | —         | Partial overrides for dark mode. When omitted, `lightTheme` overrides are applied to both modes.                                |
| `theme`       | `Theme`             | —         | **Deprecated.** Mapped to `lightTheme` internally. If both are provided, `lightTheme` wins.                                     |
| `cssSelector` | `string`            | `"body"`  | CSS selector where `--openui-*` variables are injected. Automatically scoped when nested (see [Nested Themes](#nested-themes)). |
| `children`    | `React.ReactNode`   | —         | Application content                                                                                                             |

## Theme Customization

Use `createTheme()` to build a type-safe partial theme. In development it validates keys and offers "did you mean?" suggestions for typos via Levenshtein distance. In production the validation is stripped by bundlers.

```tsx
import { ThemeProvider, createTheme } from "@openuidev/react-ui";

<ThemeProvider
  mode="light"
  lightTheme={createTheme({ interactiveAccentDefault: "oklch(0.6 0.2 260)" })}
>
  <YourApp />
</ThemeProvider>;
```

When you need different overrides for light and dark modes, pass both `lightTheme` and `darkTheme`:

```tsx
<ThemeProvider
  mode={prefersDark ? "dark" : "light"}
  lightTheme={createTheme({ interactiveAccentDefault: "oklch(0.6 0.2 260)" })}
  darkTheme={createTheme({ interactiveAccentDefault: "oklch(0.7 0.15 260)" })}
>
  <YourApp />
</ThemeProvider>
```

When `darkTheme` is omitted, `lightTheme` overrides are applied to both modes so a single set of brand customizations "just works".

## Nested Themes

ThemeProvider supports nesting out of the box. When a ThemeProvider detects a parent provider above it:

1. It wraps its children in a `<div style="display: contents">` with a generated scoped class.
2. It injects CSS variables scoped to that class instead of targeting `body`.
3. The parent's theme is **not** inherited — each nested provider merges its own overrides onto the built-in defaults for the active mode.

```tsx
<ThemeProvider mode="light">
  <MainApp />
  <ThemeProvider mode="dark">
    {/* Dark sidebar — CSS vars scoped, won't affect MainApp */}
    <Sidebar />
  </ThemeProvider>
</ThemeProvider>
```

The `display: contents` wrapper is invisible to layout (flex/grid children pass through). Portal components (`Select`, `FloatingUIPortal`, `GalleryModal`, etc.) automatically pick up the scoped theme via `portalThemeClassName`.

To bypass auto-scoping and target a specific selector, pass `cssSelector` explicitly:

```tsx
<ThemeProvider mode="dark" cssSelector=".sidebar">
  <Sidebar />
</ThemeProvider>
```

## `useTheme` Hook

```tsx
import { useTheme } from "@openuidev/react-ui";

function MyComponent() {
  const { theme, mode, portalThemeClassName } = useTheme();

  return <div style={{ color: theme.textNeutralPrimary }}>Current mode: {mode}</div>;
}
```

**Return value:**

| Field                  | Type        | Description                                                                    |
| ---------------------- | ----------- | ------------------------------------------------------------------------------ |
| `theme`                | `Theme`     | Fully resolved theme object                                                    |
| `mode`                 | `ThemeMode` | `"light"` or `"dark"`                                                          |
| `portalThemeClassName` | `string`    | CSS class name to add to portal containers so they inherit the theme variables |

Falls back to `defaultLightTheme` when no provider is present — components and hooks always receive a valid theme.

## Portal Theming

The `portalThemeClassName` is for floating elements (tooltips, dropdowns, modals) rendered via React portals outside the ThemeProvider's DOM subtree. The ThemeProvider's injected `<style>` already targets `.openui-theme-portal-{id}`, so add the class to your portal wrapper:

```tsx
const { portalThemeClassName } = useTheme();
return createPortal(
  <div className={portalThemeClassName}>
    <Tooltip />
  </div>,
  document.body,
);
```

## CSS Variable Consumption

`cssUtils.scss` is auto-generated at build time by `generate-css-utils.ts`. Each SCSS variable includes a fallback value from `defaultLightTheme`:

```scss
// Auto-generated — do not edit manually
$background: var(--openui-background, oklch(0.97 0 89.876 / 1));
$space-m: var(--openui-space-m, 12px);
```

Use it in component SCSS:

```scss
@use "../../cssUtils" as cssUtils;

.my-card {
  background-color: cssUtils.$foreground;
  color: cssUtils.$text-neutral-primary;
  border: 1px solid cssUtils.$border-default;
  border-radius: cssUtils.$radius-m;
  padding: cssUtils.$space-m;
  box-shadow: cssUtils.$shadow-m;
  @include cssUtils.typography(body, default);
}
```

The `typography()` mixin sets both `font` (shorthand) and `letter-spacing` from the compound typography tokens.

## Theme Token Reference

Every token follows the naming convention:

- **TypeScript key**: `camelCase` (e.g. `interactiveAccentDefault`)
- **CSS variable**: `--openui-{kebab-case}` (e.g. `--openui-interactive-accent-default`)
- **SCSS variable**: `${kebab-case}` (e.g. `$interactive-accent-default`)

### Surface Colors

| TS Key               | CSS Variable                   | Description                 |
| -------------------- | ------------------------------ | --------------------------- |
| `background`         | `--openui-background`          | Main page/app background    |
| `foreground`         | `--openui-foreground`          | Card/container background   |
| `popoverBackground`  | `--openui-popover-background`  | Popover/dropdown background |
| `sunkLight`          | `--openui-sunk-light`          | Lightly recessed surface    |
| `sunk`               | `--openui-sunk`                | Recessed surface (inputs)   |
| `sunkDeep`           | `--openui-sunk-deep`           | Deeply recessed surface     |
| `elevatedLight`      | `--openui-elevated-light`      | Lightly elevated surface    |
| `elevated`           | `--openui-elevated`            | Elevated surface            |
| `elevatedStrong`     | `--openui-elevated-strong`     | Strongly elevated surface   |
| `elevatedIntense`    | `--openui-elevated-intense`    | Intensely elevated surface  |
| `overlay`            | `--openui-overlay`             | Modal/overlay backdrop      |
| `highlightSubtle`    | `--openui-highlight-subtle`    | Subtle hover highlight      |
| `highlight`          | `--openui-highlight`           | Default highlight           |
| `highlightStrong`    | `--openui-highlight-strong`    | Strong highlight            |
| `highlightIntense`   | `--openui-highlight-intense`   | Intense highlight/selection |
| `invertedBackground` | `--openui-inverted-background` | Inverted surface            |
| `infoBackground`     | `--openui-info-background`     | Info status background      |
| `successBackground`  | `--openui-success-background`  | Success status background   |
| `alertBackground`    | `--openui-alert-background`    | Alert/warning background    |
| `dangerBackground`   | `--openui-danger-background`   | Error/danger background     |
| `purpleBackground`   | `--openui-purple-background`   | Purple accent background    |
| `pinkBackground`     | `--openui-pink-background`     | Pink accent background      |

### Text Colors

| TS Key                        | CSS Variable                              | Description                          |
| ----------------------------- | ----------------------------------------- | ------------------------------------ |
| `textNeutralPrimary`          | `--openui-text-neutral-primary`           | Primary body text                    |
| `textNeutralSecondary`        | `--openui-text-neutral-secondary`         | Secondary/muted text                 |
| `textNeutralTertiary`         | `--openui-text-neutral-tertiary`          | Disabled/hint text                   |
| `textNeutralLink`             | `--openui-text-neutral-link`              | Hyperlink text                       |
| `textBrand`                   | `--openui-text-brand`                     | Brand-colored text                   |
| `textWhite`                   | `--openui-text-white`                     | Forced white text                    |
| `textBlack`                   | `--openui-text-black`                     | Forced black text                    |
| `textAccentPrimary`           | `--openui-text-accent-primary`            | Text on accent backgrounds           |
| `textAccentSecondary`         | `--openui-text-accent-secondary`          | Secondary text on accent backgrounds |
| `textAccentTertiary`          | `--openui-text-accent-tertiary`           | Disabled text on accent backgrounds  |
| `textSuccessPrimary`          | `--openui-text-success-primary`           | Success message text                 |
| `textSuccessInverted`         | `--openui-text-success-inverted`          | Text on success backgrounds          |
| `textAlertPrimary`            | `--openui-text-alert-primary`             | Alert/warning text                   |
| `textAlertInverted`           | `--openui-text-alert-inverted`            | Text on alert backgrounds            |
| `textDangerPrimary`           | `--openui-text-danger-primary`            | Error text                           |
| `textDangerSecondary`         | `--openui-text-danger-secondary`          | Secondary error text                 |
| `textDangerTertiary`          | `--openui-text-danger-tertiary`           | Disabled error text                  |
| `textDangerInvertedPrimary`   | `--openui-text-danger-inverted-primary`   | Primary text on danger backgrounds   |
| `textDangerInvertedSecondary` | `--openui-text-danger-inverted-secondary` | Secondary text on danger backgrounds |
| `textDangerInvertedTertiary`  | `--openui-text-danger-inverted-tertiary`  | Disabled text on danger backgrounds  |
| `textInfoPrimary`             | `--openui-text-info-primary`              | Info text                            |
| `textInfoInverted`            | `--openui-text-info-inverted`             | Text on info backgrounds             |
| `textPinkPrimary`             | `--openui-text-pink-primary`              | Pink accent text                     |
| `textPinkInverted`            | `--openui-text-pink-inverted`             | Text on pink backgrounds             |
| `textPurplePrimary`           | `--openui-text-purple-primary`            | Purple accent text                   |
| `textPurpleInverted`          | `--openui-text-purple-inverted`           | Text on purple backgrounds           |

### Interactive Colors

| TS Key                                 | CSS Variable                                       | Description                 |
| -------------------------------------- | -------------------------------------------------- | --------------------------- |
| `interactiveAccentDefault`             | `--openui-interactive-accent-default`              | Primary button default      |
| `interactiveAccentHover`               | `--openui-interactive-accent-hover`                | Primary button hover        |
| `interactiveAccentPressed`             | `--openui-interactive-accent-pressed`              | Primary button pressed      |
| `interactiveAccentDisabled`            | `--openui-interactive-accent-disabled`             | Primary button disabled     |
| `interactiveDestructiveDefault`        | `--openui-interactive-destructive-default`         | Destructive ghost default   |
| `interactiveDestructiveHover`          | `--openui-interactive-destructive-hover`           | Destructive ghost hover     |
| `interactiveDestructivePressed`        | `--openui-interactive-destructive-pressed`         | Destructive ghost pressed   |
| `interactiveDestructiveDisabled`       | `--openui-interactive-destructive-disabled`        | Destructive ghost disabled  |
| `interactiveDestructiveAccentDefault`  | `--openui-interactive-destructive-accent-default`  | Filled destructive default  |
| `interactiveDestructiveAccentHover`    | `--openui-interactive-destructive-accent-hover`    | Filled destructive hover    |
| `interactiveDestructiveAccentPressed`  | `--openui-interactive-destructive-accent-pressed`  | Filled destructive pressed  |
| `interactiveDestructiveAccentDisabled` | `--openui-interactive-destructive-accent-disabled` | Filled destructive disabled |

### Border Colors

| TS Key                      | CSS Variable                           | Description                   |
| --------------------------- | -------------------------------------- | ----------------------------- |
| `borderDefault`             | `--openui-border-default`              | Default border                |
| `borderInteractive`         | `--openui-border-interactive`          | Interactive element border    |
| `borderInteractiveEmphasis` | `--openui-border-interactive-emphasis` | Emphasized interactive border |
| `borderInteractiveSelected` | `--openui-border-interactive-selected` | Selected interactive border   |
| `borderAccent`              | `--openui-border-accent`               | Accent/brand border           |
| `borderAccentEmphasis`      | `--openui-border-accent-emphasis`      | Emphasized accent border      |
| `borderInfo`                | `--openui-border-info`                 | Info status border            |
| `borderInfoEmphasis`        | `--openui-border-info-emphasis`        | Emphasized info border        |
| `borderAlert`               | `--openui-border-alert`                | Alert border                  |
| `borderAlertEmphasis`       | `--openui-border-alert-emphasis`       | Emphasized alert border       |
| `borderSuccess`             | `--openui-border-success`              | Success border                |
| `borderSuccessEmphasis`     | `--openui-border-success-emphasis`     | Emphasized success border     |
| `borderDanger`              | `--openui-border-danger`               | Danger border                 |
| `borderDangerEmphasis`      | `--openui-border-danger-emphasis`      | Emphasized danger border      |

### Chat Colors

| TS Key                 | CSS Variable                       | Description             |
| ---------------------- | ---------------------------------- | ----------------------- |
| `chatUserResponseBg`   | `--openui-chat-user-response-bg`   | User message background |
| `chatUserResponseText` | `--openui-chat-user-response-text` | User message text       |

### Spacing

| TS Key     | CSS Variable         | Default |
| ---------- | -------------------- | ------- |
| `space000` | `--openui-space-000` | `0`     |
| `space3xs` | `--openui-space-3xs` | `2px`   |
| `space2xs` | `--openui-space-2xs` | `4px`   |
| `spaceXs`  | `--openui-space-xs`  | `6px`   |
| `spaceS`   | `--openui-space-s`   | `8px`   |
| `spaceSM`  | `--openui-space-s-m` | `10px`  |
| `spaceM`   | `--openui-space-m`   | `12px`  |
| `spaceML`  | `--openui-space-m-l` | `16px`  |
| `spaceL`   | `--openui-space-l`   | `18px`  |
| `spaceXl`  | `--openui-space-xl`  | `24px`  |
| `space2xl` | `--openui-space-2xl` | `36px`  |
| `space3xl` | `--openui-space-3xl` | `48px`  |

### Border Radius

| TS Key       | CSS Variable           | Default  |
| ------------ | ---------------------- | -------- |
| `radiusNone` | `--openui-radius-none` | `0`      |
| `radius3xs`  | `--openui-radius-3xs`  | `1px`    |
| `radius2xs`  | `--openui-radius-2xs`  | `2px`    |
| `radiusXs`   | `--openui-radius-xs`   | `4px`    |
| `radiusS`    | `--openui-radius-s`    | `6px`    |
| `radiusM`    | `--openui-radius-m`    | `8px`    |
| `radiusL`    | `--openui-radius-l`    | `10px`   |
| `radiusXl`   | `--openui-radius-xl`   | `12px`   |
| `radius2xl`  | `--openui-radius-2xl`  | `14px`   |
| `radius3xl`  | `--openui-radius-3xl`  | `16px`   |
| `radius4xl`  | `--openui-radius-4xl`  | `20px`   |
| `radius5xl`  | `--openui-radius-5xl`  | `24px`   |
| `radius6xl`  | `--openui-radius-6xl`  | `28px`   |
| `radius7xl`  | `--openui-radius-7xl`  | `32px`   |
| `radius8xl`  | `--openui-radius-8xl`  | `40px`   |
| `radius9xl`  | `--openui-radius-9xl`  | `48px`   |
| `radiusFull` | `--openui-radius-full` | `9999px` |

### Shadows

| TS Key      | CSS Variable          | Usage                |
| ----------- | --------------------- | -------------------- |
| `shadow0`   | `--openui-shadow-0`   | No shadow            |
| `shadowS`   | `--openui-shadow-s`   | Subtle (buttons)     |
| `shadowM`   | `--openui-shadow-m`   | Medium (cards)       |
| `shadowL`   | `--openui-shadow-l`   | Large (dropdowns)    |
| `shadowXl`  | `--openui-shadow-xl`  | Extra large (modals) |
| `shadow2xl` | `--openui-shadow-2xl` | High elevation       |
| `shadow3xl` | `--openui-shadow-3xl` | Maximum elevation    |

## Swatch System

`swatches.ts` defines 20 color families (neutral, slate, gray, zinc, stone, blue, sky, cyan, teal, emerald, lime, amber, orange, green, yellow, red, purple, violet, fuchsia, pink), each with 14 shades (25-1000) in oklch format.

`defaultTheme.ts` uses `createColorTheme()` to derive all semantic tokens from two swatch selectors:

- **`neutralSwatch`** -- used for backgrounds, text, and borders
- **`brandSwatch`** -- used for accent/interactive colors

Accent text colors are automatically picked for WCAG AA Large contrast via `pickAccentTextFromNeutral()`, which compares shade-25 and shade-1000 of the neutral swatch against the brand solid color and selects the one that passes the 3:1 contrast ratio threshold.
