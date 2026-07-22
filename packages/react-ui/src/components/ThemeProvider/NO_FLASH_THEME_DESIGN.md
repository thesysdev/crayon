# No-Flash Color Scheme Architecture

> **Status:** Implemented and validated on `codex/no-flash-theme`; PR preparation in progress
>
> **Last researched:** 2026-07-23
>
> **Target package:** `@openuidev/react-ui`
>
> **Supersedes:** The approach from closed PR #737. That PR must not be used as an implementation base.

## Implementation Record

The implementation resolves the open naming and behavior questions in this document as follows:

- `ColorSchemeScript` is the parser-time initializer.
- `ColorSchemeProvider` and `useColorScheme` own runtime preference state.
- `createColorSchemeConfig` produces the shared serializable configuration; the opt-in root provider defaults to `system` and local-storage key `openui-color-scheme`.
- `getColorSchemeHtmlProps` and `openuiColorSchemeHtmlProps` define the root HTML hydration/no-JavaScript contract. A supplied `serverMode` is authoritative during bootstrap and initial client startup.
- `ThemeProvider` retains the legacy light fallback when no root color-scheme provider exists. Inside one, omitted `mode` inherits the resolved root scheme.
- Forced mode never writes itself to storage. Calling `setMode` while forced saves the selected preference for a later unforced page while the forced appearance remains active.
- CSP uses direct `nonce` props on the script, root provider transition style, and theme provider style.
- Browser-only preference state remains `undefined` in the root store's server snapshot. `useTheme` deliberately supplies a light JavaScript fallback plus `isModeServerResolved=false`; its CSS contains both schemes.
- Root inheriting providers emit only custom overrides because complete defaults are preloaded. Explicit and nested scopes emit complete themes to preserve the existing reset behavior.

Production Next.js validation with external JavaScript blocked confirmed:

| Scenario                           | Before hydration                                   | After hydration                                   |
| ---------------------------------- | -------------------------------------------------- | ------------------------------------------------- |
| Stored dark, light device          | attr `dark`; custom background `rgb(10, 10, 10)`   | unchanged; context `dark`                         |
| Stored light, dark device          | attr `light`; custom background `rgb(250,250,250)` | unchanged; context `light`                        |
| JavaScript disabled, dark device   | no attribute; dark media-fallback tokens visible   | not applicable                                    |
| Strict CSP with nonce, stored dark | script and theme styles accepted; dark tokens      | no CSP console errors in the isolated nonce probe |

Live system changes, light/dark/system controls, cross-tab storage events, key removal, invalid values, forced mode, transition cleanup, selector lists, nested scopes, portals, and hostile token strings are covered by unit or browser validation.

Compatibility and publication validation also passed:

- React 18 server rendering against the packed package, including nonce-bearing script/style output and quote-safe theme CSS.
- React 19 through the workspace test and production Next.js example.
- A Vite 6 production build using package JavaScript plus full and per-component CSS imports.
- Package TypeScript, ESLint, Prettier, CSS artifact, Publint, and Are the Types Wrong checks.

### Measured cost

Measurements use generated CSS and built-package React server output from the final implementation:

| Artifact                                           | Before        | After         | Delta                          |
| -------------------------------------------------- | ------------- | ------------- | ------------------------------ |
| Generated root defaults, uncompressed              | 23,832 bytes  | 35,619 bytes  | +11,787 bytes                  |
| Generated root defaults, gzip                      | 3,135 bytes   | 3,446 bytes   | +311 bytes                     |
| Built default parser-time script                   | —             | 873 bytes     | 393 bytes gzip                 |
| Root inherited `ThemeProvider` with no overrides   | no style node | no style node | zero theme-style overhead      |
| Root inherited provider with one override per mode | —             | 568 bytes     | server-rendered style overhead |
| Explicit full dark theme                           | —             | 13,160 bytes  | server-rendered style overhead |

The default path avoids duplicating complete themes in HTML. The larger explicit/nested style is intentional: those scopes retain complete-token reset semantics instead of inheriting potentially conflicting variables from an outer scope.

## Purpose

This document is the implementation specification for eliminating inaccurate color-scheme paint during SSR and SSG while preserving OpenUI's custom themes, nested theme scopes, portals, React 18 support, and standalone stylesheet imports.

The central decision is to separate two concerns that the current `ThemeProvider` mixes together:

1. **Global color-scheme preference** — the user's selected `light`, `dark`, or `system` mode, persistence, pre-paint selection, and runtime synchronization.
2. **Theme token scoping** — resolving OpenUI token objects, generating `--openui-*` variables, nested providers, explicit forced modes, custom selectors, and portal classes.

The no-flash guarantee must come from CSS and a small parser-time selector script. It must not depend on React hydrating quickly.

## Executive Decision

The future implementation must follow this sequence:

```text
SSR/SSG HTML contains CSS for both light and dark schemes
                         |
                         v
Parser-time script reads saved mode or prefers-color-scheme
                         |
                         v
Script sets data-openui-color-scheme="light|dark" on <html>
                         |
                         v
CSS selects the correct tokens before the first paint
                         |
                         v
React provider hydrates, adopts the same mode, and subscribes
to storage and operating-system preference changes
```

React context is not the mechanism that prevents flicker. It is the post-hydration API for observing and changing the preference.

## Terminology

Use these terms consistently in code and documentation:

| Term                      | Meaning                                                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Theme**                 | The complete OpenUI design-token object, including colors, typography, spacing, radii, shadows, and chart palettes.                                          |
| **Selected mode**         | User preference: `"light"`, `"dark"`, or `"system"`. This is the value that may be persisted.                                                                |
| **Resolved mode**         | Actual scheme applied to CSS: always `"light"` or `"dark"`. `"system"` resolves through `prefers-color-scheme`.                                              |
| **Forced mode**           | A non-persistent `"light"` or `"dark"` override for a page or scoped subtree.                                                                                |
| **Root scheme**           | The global resolved mode represented by an attribute on `<html>`. There must be only one root scheme manager.                                                |
| **Scoped theme**          | A nested `ThemeProvider` whose variables are restricted to a generated class or explicit selector.                                                           |
| **First paint**           | The first frame rendered after HTML and blocking CSS are parsed, which may occur before React JavaScript downloads or hydrates.                              |
| **Hydration-safe markup** | Server markup that is identical to the first client hydration render. Correct CSS first paint does not automatically make mode-dependent JSX hydration-safe. |

## Problem Statement

### Current OpenUI behavior

As of `origin/main` on 2026-07-23:

- `ThemeMode` contains only `"light" | "dark"`.
- A root `ThemeProvider` without a `mode` defaults to `"light"`.
- `openui-defaults.scss` defines light variables on `:root` and dark variables only inside `@media (prefers-color-scheme: dark)`.
- `ThemeProvider` resolves one active theme and creates its `<style>` element in `useInsertionEffect`.
- The provider's active and custom variables are absent from server HTML.
- There is no built-in persisted preference, `system` mode, pre-paint script, storage subscription, cross-tab synchronization, or root `color-scheme` management.
- Many repository examples render `<ThemeProvider>` without supplying `mode`.

These pieces can disagree before and after hydration.

### Confirmed browser evidence

A Next.js page was tested in a Chromium browser emulating a light operating-system scheme while rendering:

```tsx
<ThemeProvider mode="dark">
  <main style={{ background: "var(--openui-background)" }} />
</ThemeProvider>
```

JavaScript chunks were held to expose the pre-hydration state.

| Sample           | Background                                      | Runtime theme style | Hydrated |
| ---------------- | ----------------------------------------------- | ------------------- | -------- |
| Before hydration | `lab(96.52 -0.0000298023 0.0000119209)` (light) | absent              | no       |
| After hydration  | `oklch(0.145 0 0)` (dark)                       | present             | yes      |

The artificial delay was approximately 723 ms. The delay makes the mismatch easy to observe; it does not create the mismatch. On a fast production page, the browser may paint for a shorter interval or hydrate before the first visible frame, which explains why the problem can appear intermittent.

A symmetric mismatch exists for forced light mode on a dark-system device.

There is another important default case:

```text
Dark-system device + <ThemeProvider> with no mode

Static CSS before hydration: dark, because of prefers-color-scheme
ThemeProvider after hydration: light, because mode defaults to light
Result: dark -> light
```

Custom tokens can also paint with stock defaults before changing to user overrides after hydration.

### When the issue can look false

The issue is not visible in every configuration:

- System preference and static defaults already agree.
- No `ThemeProvider` is mounted.
- The desired mode is light on a light-system device or dark on a dark-system device.
- Hydration happens before the browser's first visible frame.
- The tested element does not consume a scheme-specific variable.

These cases reduce visibility but do not provide a correctness guarantee.

## What Established Libraries Do

### next-themes

next-themes assumes the application's CSS already contains selectors for every theme. Its provider server-renders a small script before its children. The script:

1. Reads the configured local-storage key.
2. Falls back to the configured default.
3. Resolves `system` with `matchMedia`.
4. Sets a class or data attribute on `document.documentElement`.
5. Sets the native `color-scheme` style when enabled.

After hydration, the provider listens for system changes and storage events, synchronizes tabs, and exposes selected and resolved values separately.

It explicitly documents that `useTheme()` values derived from client storage are not safe for SSR-dependent JSX. Consumers must delay that UI or render it through CSS.

### Material UI

MUI's CSS-variable mode generates selectors for all configured color schemes. `InitColorSchemeScript` runs before application content, reads separate mode and scheme storage keys, resolves `system`, and sets the configured selector on a root node.

Its runtime provider uses a storage-manager interface with `get`, `set`, and `subscribe`. It deliberately exposes `mode` and the current color scheme as `undefined` on the server when they cannot be known.

MUI also supports:

- A configurable selector format.
- A CSP nonce for its initialization script.
- Separate light and dark named schemes.
- Native `color-scheme` generation.
- Cross-tab storage synchronization.
- Optional transition suppression.

### Mantine

Mantine renders its CSS variables as CSS and selects mode-specific values using `data-mantine-color-scheme` on `<html>`. `ColorSchemeScript` sets that attribute before hydration from local storage, a forced value, a default value, or the operating-system preference.

Its provider manages a pluggable storage interface and runtime changes. Mantine explicitly warns that mode-dependent React values may differ between server and client; its documentation recommends CSS mixins or visibility classes for SSR UI.

Mantine requires `defaultColorScheme` and `forceColorScheme` to match between the script and provider. A mismatch causes the same flicker the script is meant to prevent.

### Chakra UI

Current Chakra delegates color-mode preference management to next-themes. Chakra's semantic-token CSS contains the scheme-dependent styling, while next-themes controls the root class. Chakra recommends client-only rendering for hook-driven UI that cannot be determined on the server.

### Shared industry pattern

All four approaches rely on the same separation:

| Layer              | Responsibility                                                                          |
| ------------------ | --------------------------------------------------------------------------------------- |
| CSS                | Contains styling for every possible first-paint scheme.                                 |
| Pre-paint script   | Selects one scheme before application content paints.                                   |
| Provider/store     | Keeps runtime React state, storage, tabs, and media queries synchronized.               |
| Server integration | Supplies a cookie or other server-readable value when JSX itself must differ by scheme. |

No client-only library can infer local storage during server rendering. They solve visual first paint with CSS and make the remaining hydration limitation explicit.

## Design Principles

The implementation must obey the following principles:

1. **Both schemes exist before JavaScript.** Unknown client preference must select pre-existing CSS, not generate CSS after hydration.
2. **The script selects; it does not style.** Theme token values must never be serialized into executable script.
3. **CSS owns first paint.** React state may be unavailable during SSR without causing an incorrect visual scheme.
4. **Selected and resolved modes are distinct.** A user choosing `system` must remain observable as `system`, while components can also observe whether it currently resolves to light or dark.
5. **One root manager owns the document attribute.** Nested theme scopes must not compete over `<html>`.
6. **Explicit scoped modes remain server-resolvable.** A nested provider forced to light or dark can safely emit its scoped active variables during SSR.
7. **Client-only preference is not presented as hydration-safe data.** The API and examples must not encourage branching server-rendered JSX on an unknowable local-storage value.
8. **Existing integration paths remain functional.** Full CSS imports, per-component CSS imports, portals, explicit selectors, nested providers, React 18, and React 19 all require coverage.
9. **Security is part of the design.** User theme values must not enter raw HTML or scripts. CSP must be supported.
10. **The first version stays focused.** Light, dark, and system are sufficient. Arbitrary named themes are not required for the initial PR.

## Proposed Component Boundaries

### Root `ColorSchemeProvider`

Introduce one root-only provider responsible for preference state, not token generation.

Tentative public types:

```ts
export type ColorSchemeMode = "light" | "dark" | "system";
export type ResolvedColorScheme = "light" | "dark";

export type ColorSchemeStorageManager = {
  get(defaultMode: ColorSchemeMode): ColorSchemeMode;
  set(mode: ColorSchemeMode): void;
  subscribe(listener: (mode: ColorSchemeMode | null) => void): () => void;
  clear(): void;
};

export type ColorSchemeConfig = {
  defaultMode?: ColorSchemeMode;
  storageKey?: string;
  forcedMode?: ResolvedColorScheme;
  disableTransitionOnChange?: boolean;
  enableColorScheme?: boolean;
};

export type ColorSchemeContextValue = {
  mode: ColorSchemeMode | undefined;
  resolvedMode: ResolvedColorScheme | undefined;
  systemMode: ResolvedColorScheme | undefined;
  forcedMode: ResolvedColorScheme | undefined;
  setMode(mode: ColorSchemeMode): void;
  clearMode(): void;
};
```

Names are subject to maintainer approval, but the semantic split is required.

Provider responsibilities:

- Adopt the selector established by the pre-paint script.
- Persist selected mode through a storage manager.
- Resolve system preference.
- Set the root attribute synchronously when the user changes mode.
- Update `document.documentElement.style.colorScheme` when enabled.
- Subscribe to `matchMedia` and storage changes.
- Synchronize other tabs.
- Avoid writing a forced page mode into the user's saved preference.
- Optionally suppress transitions for one recalculation during a change.

The provider must not use a `MutationObserver` as its main state mechanism. The provider/store owns the attribute. Supporting arbitrary external mutations would introduce another source of truth and the stale-context bug found in the closed PR.

### `ColorSchemeScript`

Provide a small server-rendered script component that runs before application content.

Tentative usage:

```tsx
const colorSchemeConfig = createColorSchemeConfig({
  defaultMode: "system",
  storageKey: "openui-color-scheme",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html {...openuiColorSchemeHtmlProps}>
      <head>
        <ColorSchemeScript config={colorSchemeConfig} nonce={nonce} />
      </head>
      <body>
        <ColorSchemeProvider config={colorSchemeConfig}>{children}</ColorSchemeProvider>
      </body>
    </html>
  );
}
```

The exact component placement will be documented per framework. It must execute before the application's paintable content.

`createColorSchemeConfig` should return a validated, serializable configuration object shared by the script and provider. Sharing one object prevents configuration drift such as different defaults or storage keys.

The initialization algorithm is:

```text
if forcedMode is light or dark:
  resolved = forcedMode
else:
  saved = validated localStorage value, or defaultMode
  resolved = saved == system ? matchMedia result : saved

set data-openui-color-scheme to resolved
set native color-scheme to resolved when enabled
```

Script constraints:

- Wrap local-storage access in `try/catch`.
- Validate saved values against `light`, `dark`, and `system`.
- Support a CSP nonce.
- Serialize only controlled configuration.
- Escape `<`, U+2028, and U+2029 in serialized data.
- Never serialize theme tokens, `cssSelector`, or arbitrary CSS.
- Remain small; target less than 1.5 KB uncompressed before framework markup.
- Document the need for `suppressHydrationWarning` on `<html>` because the script intentionally changes its attribute before React hydrates.

### HTML fallback props

Provide a helper or documented props for the server `<html>` element:

```ts
export const openuiColorSchemeHtmlProps = {
  suppressHydrationWarning: true,
  // Include a concrete data attribute only when the server default is known.
};
```

No-JavaScript behavior:

- `defaultMode="system"`: omit the attribute and let `prefers-color-scheme` CSS select the scheme.
- `defaultMode="light" | "dark"`: render the concrete attribute on `<html>`.
- A stored client preference cannot be honored with JavaScript disabled. This limitation is unavoidable and must be documented.

### Existing `ThemeProvider`

Keep `ThemeProvider` responsible for theme objects and scopes.

Compatibility goals:

- Explicit `mode="light" | "dark"` remains a controlled, resolved mode.
- A nested explicit mode remains a forced local scope and is fully server-resolvable.
- Without a `ColorSchemeProvider`, omitted `mode` can continue to fall back to light for backward compatibility.
- With a root `ColorSchemeProvider`, omitted `mode` inherits its resolved scheme.
- `lightTheme`, `darkTheme`, deprecated `theme`, `cssSelector`, nesting, and portal behavior remain supported.

The provider's CSS-generation behavior must change:

- A root or inheriting provider with client-resolved mode must make both light and dark token rules available during SSR.
- A provider with an explicit resolved mode may render only that scoped active rule because its value is known on the server.
- Custom light and dark overrides must be present before first paint.
- Styles must be rendered with a safe React `<style>{cssText}</style>` child or assigned through DOM `textContent`; never interpolate theme values into `dangerouslySetInnerHTML`.
- The current `useInsertionEffect`-only path cannot remain the sole source of active variables.

## CSS Selector Model

### Static defaults

The generated defaults should conceptually follow this structure:

```css
:root,
:root[data-openui-color-scheme="light"] {
  /* complete light defaults */
}

:root[data-openui-color-scheme="dark"] {
  /* complete dark defaults */
}

@media (prefers-color-scheme: dark) {
  :root:not([data-openui-color-scheme]) {
    /* complete dark defaults for system/no-JS fallback */
  }
}
```

The explicit attribute must override the media fallback. A user selecting light on a dark-system device must stay light.

The generator, not a manually maintained file, remains the source of these rules.

### Root custom themes

For a root provider targeting `body`, the server style should conceptually contain:

```css
:root[data-openui-color-scheme="light"] body,
:root[data-openui-color-scheme="light"] .openui-theme-portal-ID {
  /* resolved light theme */
}

:root[data-openui-color-scheme="dark"] body,
:root[data-openui-color-scheme="dark"] .openui-theme-portal-ID {
  /* resolved dark theme */
}

@media (prefers-color-scheme: dark) {
  :root:not([data-openui-color-scheme]) body,
  :root:not([data-openui-color-scheme]) .openui-theme-portal-ID {
    /* resolved dark system fallback */
  }
}
```

Light/no-attribute fallback rules may also be required depending on the cascade produced by the generator. Tests, not visual inspection alone, must verify every selector state.

### Nested and forced scopes

A nested provider with explicit `mode="dark"` should continue to emit a scoped rule independent of the root scheme:

```css
.openui-theme-ID,
.openui-theme-portal-ID {
  /* resolved dark theme */
}
```

A nested provider inheriting the root scheme but providing different light/dark overrides must emit both selector-qualified scoped rules.

The ordering and specificity must ensure that a locally forced light scope can override a dark root and vice versa. Portal rules must receive the same scheme and overrides as the visual subtree.

### Selector-list handling

`cssSelector` accepts arbitrary selector text and may contain a comma-separated list. Prefixing the entire string naively produces incorrect CSS.

The implementation must either:

- Parse and prefix each top-level selector safely, or
- Use `:is(...)` where browser support and specificity behavior are acceptable.

Tests must include selector lists and functional selectors. Do not reintroduce the comma-selector bug found in the closed PR.

## Runtime State Model

### Store snapshot

The root store should contain:

```ts
type ColorSchemeSnapshot = {
  mode: ColorSchemeMode | undefined;
  resolvedMode: ResolvedColorScheme | undefined;
  systemMode: ResolvedColorScheme | undefined;
  forcedMode: ResolvedColorScheme | undefined;
};
```

The server snapshot must be deterministic. If mode is not server-readable, mode-dependent context fields should be `undefined` rather than pretending the default is the user's saved selection.

The first client hydration render must match the server snapshot. After hydration, the provider can publish the selector already chosen by the script. `useSyncExternalStore` is a suitable primitive if its server snapshot and subscription contract are implemented correctly.

### Setting a mode

`setMode(nextMode)` should perform one coordinated update:

1. Validate `nextMode`.
2. Persist it unless a forced mode is active.
3. Resolve it against the current system preference.
4. Optionally install a temporary transition-disabling style with a CSP nonce.
5. Set the root attribute and native `color-scheme` synchronously.
6. Publish one consistent store snapshot.
7. Remove the transition-disabling style after recalculation.

The DOM and context must never intentionally represent different resolved modes after the update finishes.

### System changes

The store listens to `(prefers-color-scheme: dark)`.

- Always update `systemMode` when the operating-system setting changes.
- Update `resolvedMode` and the root attribute only when selected mode is `system` and no forced mode is active.
- Do not overwrite the persisted value `system` with `light` or `dark`.

### Storage changes

The default manager uses local storage and subscribes to the browser `storage` event.

- Cross-tab changes update mode, resolved mode, and the root attribute.
- Deleting the key restores `defaultMode`.
- Invalid stored values restore `defaultMode`.
- Same-tab `setMode` updates through the store directly because the browser does not dispatch a storage event back to the tab that performed the write.

### Forced mode

Forced mode is non-persistent:

- It wins over selected and system modes for the root attribute.
- `setMode` either remains available to update the saved preference for later or becomes a no-op; choose and document one behavior before implementation. next-themes updates no forced page styling, while preserving the saved preference.
- Removing forced mode restores the current saved/default selection.
- The context exposes `forcedMode` so toggle controls can disable themselves.

## SSR and Hydration Contract

### Guaranteed

The library should guarantee:

- Correct CSS variables before first paint for forced, stored, default, and system schemes when the script is installed correctly.
- No light-to-dark or dark-to-light token transition caused by hydration.
- No hydration warning from OpenUI's own rendered nodes.
- A documented `suppressHydrationWarning` requirement for the intentionally mutated `<html>` attribute.

### Not automatically guaranteed

The library cannot guarantee server-correct JSX based on local storage:

```tsx
// Unsafe when the server cannot know resolvedMode.
return resolvedMode === "dark" ? <MoonIcon /> : <SunIcon />;
```

Supported solutions are:

1. Render both variants and hide one with scheme selectors.
2. Delay the mode-dependent fragment until mounted.
3. Read a cookie or other server-visible preference and provide it as the initial server value.

Documentation must make this distinction explicit. “No theme flash” must not be advertised as “all theme-dependent markup is SSR-correct.”

### Existing non-CSS theme consumers

OpenUI cannot treat this as only a stylesheet problem. The package currently reads `useTheme().mode` or `useTheme().theme` in JavaScript for behavior that can affect rendered markup, inline styles, SVG, or measurement. Examples include:

- Syntax-highlighter theme selection in `MarkDownRenderer`.
- Chart palette arrays selected from the theme object.
- Chart SVG and inline colors calculated from `mode`.
- Inline chart foreground and text custom properties copied from the theme object.
- Radius and typography values used in chart geometry or canvas measurement.
- Portal class propagation.

When the root preference comes only from local storage, the server cannot choose the correct JavaScript theme object. CSS can still produce the correct page colors before paint, but an SVG fill, syntax-highlighter subtree, or chart geometry derived from the server fallback can change after hydration.

Before changing the context contract, implementation work must inventory every `useTheme()` consumer and classify it:

| Consumer type                               | Required treatment                                                                                                                                                      |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CSS-compatible color or visibility          | Move to OpenUI variables or selector-driven CSS so first paint does not depend on context.                                                                              |
| Explicit server-known scoped mode           | Keep using the resolved theme object; the mode is deterministic.                                                                                                        |
| Non-CSS values such as chart palette arrays | Use a deterministic server fallback and either accept a documented client update, delay the scheme-dependent fragment, or consume a server-readable initial preference. |
| Layout or geometry values                   | Ensure hydration produces identical markup or require a server-readable preference; a visual CSS fix alone is insufficient.                                             |
| Portal identity/class                       | Keep deterministic across server and client; only the variables selected by that class should change.                                                                   |

Do not change `mode` from a guaranteed `"light" | "dark"` value to `undefined` without updating these consumers. Several currently use `mode === "light" ? lightValue : darkValue`, which would silently interpret `undefined` as dark.

The new PR must include representative delayed-hydration tests for `MarkDownRenderer` and charts, not only a background-color probe.

### Optional server-readable preference

The architecture should leave room for an advanced integration in which an application:

- Stores or mirrors the selected mode in a cookie.
- Reads it during SSR.
- Sets the initial `<html>` attribute.
- Supplies the same server snapshot to the provider.

A built-in cross-framework cookie manager is not required in the first PR, but the public API must not make this integration impossible.

## Security Requirements

### Theme CSS

- Never place token values in `dangerouslySetInnerHTML`.
- Use a normal React style child or DOM `textContent` so `</style>` sequences are escaped/treated as text.
- Preserve development validation for unknown and non-string theme fields.
- Add a regression test with a value containing `</style><script>` and verify that no script element is created.
- Treat `cssSelector` as trusted configuration for CSS targeting, but still prevent it from breaking out of the style element.

### Initialization script

- The script necessarily uses inline executable content; support `nonce`.
- Serialize only validated primitives and fixed keys.
- Escape script-breaking characters.
- Do not pass functions, storage-manager implementations, theme objects, selectors containing arbitrary code, or user content into the script.
- Catch unavailable or blocked storage access.
- Apply a strict allow-list to storage values.

### CSP

Test with a CSP that blocks unapproved inline scripts and styles. Both initialization script and generated provider styles need an approved nonce strategy. The design must decide whether `ThemeProvider` receives a `nonce` prop or a nonce resolver/context.

## Compatibility Requirements

The implementation is incomplete unless all of these remain supported:

- React 18 and React 19 peer ranges.
- Next.js SSR/SSG and production hydration.
- Client-only React applications.
- Full `index.css` imports.
- `components.css` and per-component stylesheet imports.
- Layered and unlayered OpenUI styles.
- Theme overrides using `lightTheme`, `darkTheme`, and deprecated `theme`.
- Root explicit modes.
- Nested explicit modes.
- Nested inherited modes with custom overrides.
- Explicit `cssSelector`.
- Comma-separated selector lists.
- Portaled dialogs, selects, tooltips, galleries, and chart tooltips.
- Runtime mode switching.
- Operating-system mode changes.
- Cross-tab storage synchronization.
- JavaScript-disabled system fallback.
- Strict CSP with a nonce.

## Required Test Matrix

### First-paint browser tests

Use a real browser and hold JavaScript chunks so the pre-hydration frame can be measured independently.

For each row, compare the relevant computed OpenUI variables before and after hydration. They must be identical.

| Device scheme | Stored mode | Default mode | Forced mode | Expected first paint |
| ------------- | ----------- | ------------ | ----------- | -------------------- |
| light         | absent      | system       | absent      | light                |
| dark          | absent      | system       | absent      | dark                 |
| light         | dark        | system       | absent      | dark                 |
| dark          | light       | system       | absent      | light                |
| light         | system      | light        | absent      | light                |
| dark          | system      | light        | absent      | dark                 |
| light         | light       | system       | dark        | dark                 |
| dark          | dark        | system       | light       | light                |

Repeat representative cases with custom light and dark themes.

Assertions:

- Background, foreground, primary text, and border variables match before and after hydration.
- The root attribute is present before application hydration when JavaScript is enabled.
- There are no hydration warnings.
- No duplicate theme style elements remain after hydration.
- Native `color-scheme` matches the resolved scheme.

### No-JavaScript tests

- `defaultMode="system"` follows device media preference.
- Concrete default light/dark produces the documented fallback.
- The page remains styled when only per-component CSS is imported.
- It is documented that a local-storage override cannot apply without JavaScript.

### Runtime tests

- Light -> dark.
- Dark -> light.
- Light/dark -> system.
- System preference changes while selected mode is system.
- System preference changes while selected mode is forced light/dark; root scheme must not change.
- Storage changes from a second page/tab.
- Storage key removal.
- Invalid storage value.
- Forced mode mount and removal.
- Transition suppression cleanup.
- Provider unmount and listener cleanup.

### ThemeProvider tests

- Root custom light and dark overrides exist in SSR HTML.
- Explicit forced mode has correct SSR variables.
- Nested forced light inside dark root.
- Nested forced dark inside light root.
- Nested inherited custom light/dark overrides.
- Portal class receives identical variables to its source scope.
- Explicit selector and selector-list handling.
- Hostile theme value cannot create markup.
- React `useId` values remain CSS-safe through `cssSafeId`.
- Chart palette validation remains intact.
- JavaScript theme consumers do not silently interpret an unknown mode as dark.
- Representative chart SVG/inline values have an explicit hydration strategy.
- `MarkDownRenderer` syntax-theme output has an explicit hydration strategy.

### Framework and package tests

- Production Next.js build and delayed-hydration run.
- React 18 test fixture.
- React 19 test fixture.
- Package typecheck, lint, test, build, CSS artifact check, publint, and attw as appropriate.
- At least one client-only/Vite fixture to verify that SSR helpers are not mandatory.

## Acceptance Criteria

The new PR is ready only when:

1. All first-paint matrix cases have the expected scheme before hydration.
2. Computed scheme-specific OpenUI variables are unchanged by hydration.
3. Stored light overrides a dark device, and stored dark overrides a light device.
4. System mode reacts to live operating-system changes.
5. Cross-tab updates synchronize.
6. Custom light/dark token overrides are correct before hydration.
7. Nested and portal themes retain their current behavior.
8. There are zero OpenUI-caused hydration warnings in the tested integrations.
9. Strict CSP works when a nonce is supplied.
10. Theme token strings cannot escape their style element.
11. Per-component CSS imports remain independently functional.
12. The initialization script stays below the agreed size budget.
13. Public documentation distinguishes CSS first-paint correctness from SSR mode-dependent JSX.
14. The PR links to an approved issue and explains the behavior change for `<ThemeProvider>` without an explicit mode.
15. Existing JavaScript `useTheme()` consumers have been audited and cannot silently render an unintended scheme when mode is unknown.

## Migration and Backward Compatibility

### Existing explicit mode

This must continue to work:

```tsx
<ThemeProvider mode="dark">...</ThemeProvider>
```

It is server-known and should receive correct dark tokens before first paint.

### Existing provider without mode

Current documented fallback is light. Changing it globally to system could be breaking even though many examples appear to expect system behavior.

Recommended compatibility rule:

- Without `ColorSchemeProvider`: retain light fallback.
- Inside `ColorSchemeProvider`: inherit the root resolved scheme.
- Update first-party examples to install `ColorSchemeProvider` with `defaultMode="system"` where system behavior is intended.

The issue and PR must explicitly call out this distinction.

### Existing application-owned mode hooks

Applications that already calculate light/dark can keep passing an explicit resolved `mode`. They may migrate to the root provider when they want built-in persistence and pre-paint selection.

### Deprecated `theme` prop

Do not combine this work with removing the deprecated `theme` prop. Preserve its current mapping and warnings.

## Implementation Sequence

Use a fresh branch from current `origin/main`. Do not continue from the closed PR or copy its implementation wholesale.

Recommended sequence inside the new PR:

1. Open or confirm the approved issue and agree on public names/defaults.
2. Add pure mode validation and resolution utilities with unit tests.
3. Add the serializable shared configuration object.
4. Update the CSS generator to emit explicit light/dark root selectors and no-attribute system fallback.
5. Add `ColorSchemeScript` with CSP and serialization tests.
6. Add the root store/provider and storage-manager interface.
7. Add system and cross-tab synchronization.
8. Integrate `ThemeProvider` so unknown/inherited schemes have both token rule sets during SSR while explicit scoped modes remain deterministic.
9. Verify nested selector and portal behavior.
10. Add the full delayed-hydration browser matrix.
11. Update first-party examples and documentation.
12. Run package and production framework validation.
13. Measure HTML, CSS, and initialization-script size and include the numbers in the PR description.

Do not remove the old insertion path until the replacement covers every import and scoping mode. Avoid a transitional commit that leaves consumers without variables.

## Rejected Alternatives

### Keep `useInsertionEffect` as the only theme source

Rejected because the browser can paint before the effect runs. Network and device speed would remain part of correctness.

### Render only the server-selected active style

Insufficient as the general solution. It fixes explicit server-known `mode="light|dark"`, but it cannot know local storage or system-derived client preference during SSR. It also sends a full active theme per provider without establishing a global preference model.

Active-only SSR CSS remains valid as an optimization for an explicitly forced scoped provider, not as the root architecture.

### Use only `prefers-color-scheme`

Rejected because it cannot represent a saved light preference on a dark device or a saved dark preference on a light device.

### Hide the application until React mounts

Rejected because it replaces a color flash with blank or delayed content, harms perceived performance, and makes styling depend on JavaScript.

### Use a `MutationObserver` on the root attribute as the primary store

Rejected because it creates competing sources of truth and does not solve first paint. The provider should own mutations and publish state directly.

### Require cookies for every application

Rejected as the baseline because it is framework-specific and unnecessary for CSS first-paint correctness. Cookies remain an advanced option for SSR mode-dependent JSX.

### Put theme values in raw HTML

Rejected because a theme string containing `</style>` can become executable markup when interpolated into `dangerouslySetInnerHTML`.

### Depend directly on next-themes

Not selected for the initial design because OpenUI must coordinate generated token CSS, nested scopes, explicit selectors, and portal classes that next-themes does not manage. The small preference store may borrow its proven behavior without coupling the package to framework-branded semantics.

## Risks and Mitigations

| Risk                                          | Mitigation                                                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| More SSR CSS when both schemes are emitted    | Deduplicate scheme-independent values where safe; measure gzip size; keep correctness before optimization.    |
| Script/provider configuration drift           | Pass one validated configuration object to both.                                                              |
| CSP blocks initialization                     | Support a nonce and document placement/header requirements.                                                   |
| Root attribute creates hydration warning      | Provide HTML props and document `suppressHydrationWarning`.                                                   |
| Context value differs from server markup      | Use deterministic server snapshots; expose unknown values honestly; document CSS/client-only/cookie patterns. |
| Selector specificity breaks nested themes     | Define selector ordering centrally and cover both nesting directions in browser tests.                        |
| Per-component CSS loses defaults              | Preserve generated standalone defaults and test component-only imports with JavaScript disabled.              |
| Comma selectors generate invalid prefixed CSS | Parse top-level selector lists or use a tested `:is(...)` strategy.                                           |
| React 18/19 style handling differs            | Test both supported peer ranges and avoid React-19-only resource-hoisting APIs.                               |
| Storage is unavailable                        | Catch access failures and use the configured default.                                                         |
| Transition suppression style leaks            | Give it a stable marker and verify cleanup after recalculation and unmount.                                   |

## Resolved Implementation Decisions

1. Public names are `ColorSchemeProvider`, `ColorSchemeScript`, and `useColorScheme`.
2. Consumers place the script explicitly before paintable content; the runtime provider does not guess a framework-specific head location.
3. The opt-in root provider defaults to `system`; existing `ThemeProvider` usage without it remains light.
4. Forced mode preserves page styling while `setMode` updates the saved preference for later.
5. `disableTransitionOnChange` defaults to false.
6. The v1 root attribute is fixed as `data-openui-color-scheme` so generated CSS and package consumers cannot drift.
7. Script and provider-generated styles accept direct nonce props.
8. `serverMode` and `serverSystemMode` are included so cookie/request-backed integrations are possible without redesigning the API. `serverMode` is authoritative during bootstrap/startup; cookie-backed integrations must keep their client storage manager synchronized with that source.
9. Root inheriting providers emit only user overrides; full theme duplication is reserved for explicit and nested scopes. Exact built artifact and HTML measurements must be recorded in the PR description.
10. One production Next.js example installs the parser-time script and root HTML props. Broader example migration can proceed separately because many examples already own a system-theme store.
11. `useTheme().mode` stays a defined `light | dark` value for compatibility. Browser-only root preference uses a deterministic light SSR fallback and exposes `isModeServerResolved=false`; internal CSS-dependent consumers were moved to selector-driven behavior where necessary.

## Research References

Primary sources reviewed on 2026-07-22 and 2026-07-23:

- next-themes README and implementation: <https://github.com/pacocoursey/next-themes>
- next-themes provider: <https://github.com/pacocoursey/next-themes/blob/main/next-themes/src/index.tsx>
- next-themes initialization script: <https://github.com/pacocoursey/next-themes/blob/main/next-themes/src/script.ts>
- MUI initialization script documentation: <https://mui.com/material-ui/react-init-color-scheme-script/>
- MUI CSS theme variable configuration: <https://mui.com/material-ui/customization/css-theme-variables/configuration/>
- MUI dark-mode and storage-manager documentation: <https://mui.com/material-ui/customization/dark-mode/>
- MUI initialization implementation: <https://github.com/mui/material-ui/blob/master/packages/mui-system/src/InitColorSchemeScript/InitColorSchemeScript.tsx>
- Mantine color-scheme documentation: <https://mantine.dev/theming/color-schemes/>
- Mantine provider documentation: <https://mantine.dev/theming/mantine-provider/>
- Mantine flicker explanation: <https://help.mantine.dev/q/color-scheme-flickering>
- Mantine initialization implementation: <https://github.com/mantinedev/mantine/blob/master/packages/%40mantine/core/src/core/MantineProvider/ColorSchemeScript/ColorSchemeScript.tsx>
- Chakra color-mode documentation: <https://chakra-ui.com/docs/components/concepts/color-mode>

## Research Artifacts

The investigation was performed in a separate worktree created from `origin/main`. Research-only artifacts there included:

- A minimal Next.js `theme-flicker` route.
- Pre- and post-hydration screenshots.
- Delayed-JavaScript browser measurements.
- A production Next.js build and delayed-hydration verification.
- An active-style SSR prototype that proved one narrow fix but is intentionally not the final architecture.

Those prototype changes and generated browser artifacts were deliberately not copied into this implementation. Future revisions should likewise start from current `origin/main` and use this document as the specification rather than reviving the closed prototype PR.

## Final Instruction for Future Work

Before editing `ThemeProvider`, its CSS generator, or color-scheme APIs for this issue:

1. Read this document completely.
2. Reconfirm the open questions in the approved issue.
3. Create a fresh branch from current `origin/main`.
4. Preserve the separation between root preference and scoped theme tokens.
5. Build CSS for both unknown first-paint schemes.
6. Treat the initialization script as a selector only.
7. Verify pre-hydration behavior in a real browser, not only unit tests.
8. Do not claim local-storage-derived JSX is SSR-safe without a server-readable preference.
