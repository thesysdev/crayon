import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useChartPalette } from "../../Charts/utils/PalletUtils";
import { MarkDownRenderer } from "../../MarkDownRenderer/MarkDownRenderer";
import { ColorSchemeProvider } from "../ColorSchemeProvider";
import { defaultDarkTheme, defaultLightTheme } from "../defaultTheme";
import { ThemeProvider, useTheme } from "../ThemeProvider";
import type { ChartColorPalette, Theme } from "../types";
import { CHART_PALETTE_KEYS } from "../types";
import { createTheme, KNOWN_THEME_KEYS } from "../utils";

// Regression tests for the types-vs-runtime drift where every `*ChartPalette`
// key (valid per the Theme type) was rejected as "unknown key" by both
// validators because the allow-list only contained Object.keys(defaultLightTheme).
// See https://github.com/thesysdev/openui/issues/714

// `Required` forces this literal to cover every declared palette key, so a new
// key added to ChartColorPalette fails compilation here until it is tested.
const allChartPalettes: Required<ChartColorPalette> = {
  defaultChartPalette: ["#101010", "#202020", "#303030"],
  barChartPalette: ["#111111", "#222222", "#333333"],
  lineChartPalette: ["#414141", "#525252", "#636363"],
  areaChartPalette: ["#747474", "#858585", "#969696"],
  pieChartPalette: ["#a7a7a7", "#b8b8b8", "#c9c9c9"],
  radarChartPalette: ["#dadada", "#ebebeb", "#fcfcfc"],
  radialChartPalette: ["#0d0d0d", "#1e1e1e", "#2f2f2f"],
  horizontalBarChartPalette: ["#404040", "#515151", "#626262"],
};

let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

describe("theme validator allow-list", () => {
  it("covers every declared chart palette key", () => {
    const missing = CHART_PALETTE_KEYS.filter((key) => !KNOWN_THEME_KEYS.has(key));
    expect(missing).toEqual([]);
  });

  it("covers every key of the default themes", () => {
    const missingLight = Object.keys(defaultLightTheme).filter((k) => !KNOWN_THEME_KEYS.has(k));
    const missingDark = Object.keys(defaultDarkTheme).filter((k) => !KNOWN_THEME_KEYS.has(k));
    expect(missingLight).toEqual([]);
    expect(missingDark).toEqual([]);
  });
});

describe("createTheme", () => {
  it("does not warn for any declared chart palette key", () => {
    createTheme({ ...allChartPalettes });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("still warns with a suggestion for a genuine typo", () => {
    createTheme({ defaultChartPalete: ["#ffffff"] } as unknown as Theme);
    expect(warnSpy).toHaveBeenCalledWith(
      '[OpenUI] Unknown theme key "defaultChartPalete". Did you mean "defaultChartPalette"?',
    );
  });
});

describe("ThemeProvider prop validation", () => {
  it("does not warn for chart palette keys on lightTheme or darkTheme", () => {
    renderToString(
      <ThemeProvider
        mode="dark"
        lightTheme={{ ...allChartPalettes }}
        darkTheme={{ ...allChartPalettes }}
      >
        <span />
      </ThemeProvider>,
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('still warns "unknown key" for keys not on the Theme type', () => {
    renderToString(
      <ThemeProvider lightTheme={{ bogusThemeKey: "red" } as unknown as Theme}>
        <span />
      </ThemeProvider>,
    );
    expect(warnSpy).toHaveBeenCalledWith(
      '[OpenUI] lightTheme contains unknown key "bogusThemeKey". It will be ignored. Use createTheme() for typo detection with suggestions.',
    );
  });
});

describe("chart palette flow (theme -> useTheme -> useChartPalette)", () => {
  it("delivers user palettes to charts and falls back to defaultChartPalette", () => {
    const defaultPalette = ["#57c8d6", "#ff6a2b", "#aabbcc"];
    const barPalette = ["#111111", "#222222", "#333333"];

    let themeFromContext: Theme | undefined;
    let barColors: string[] = [];
    let lineColors: string[] = [];

    const Probe = () => {
      const { theme } = useTheme();
      themeFromContext = theme;
      // Exactly what BarChart does.
      barColors = useChartPalette({
        chartThemeName: "ocean",
        themePaletteName: "barChartPalette",
        dataLength: 2,
      });
      // lineChartPalette is not set -> must fall back to defaultChartPalette.
      lineColors = useChartPalette({
        chartThemeName: "ocean",
        themePaletteName: "lineChartPalette",
        dataLength: 2,
      });
      return null;
    };

    renderToString(
      <ThemeProvider
        mode="dark"
        darkTheme={createTheme({
          defaultChartPalette: defaultPalette,
          barChartPalette: barPalette,
        })}
      >
        <Probe />
      </ThemeProvider>,
    );

    expect(themeFromContext?.defaultChartPalette).toEqual(defaultPalette);
    expect(themeFromContext?.barChartPalette).toEqual(barPalette);
    expect(barColors.length).toBe(2);
    expect(barColors.every((color) => barPalette.includes(color))).toBe(true);
    expect(lineColors.length).toBe(2);
    expect(lineColors.every((color) => defaultPalette.includes(color))).toBe(true);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe("ThemeProvider server-rendered color-scheme CSS", () => {
  it("keeps the legacy light fallback without a ColorSchemeProvider", () => {
    let observedMode: string | undefined;
    const Probe = () => {
      observedMode = useTheme().mode;
      return null;
    };

    const html = renderToString(
      <ThemeProvider
        lightTheme={{ interactiveAccentDefault: "legacy-light" }}
        darkTheme={{ interactiveAccentDefault: "legacy-dark" }}
      >
        <Probe />
      </ThemeProvider>,
    );

    expect(observedMode).toBe("light");
    expect(html).toContain("legacy-light");
    expect(html).not.toContain("legacy-dark");
    expect(html).not.toContain("data-openui-color-scheme=&quot;");
  });

  it("renders custom light, dark, system-fallback, and portal rules during SSR", () => {
    const html = renderToString(
      <ColorSchemeProvider>
        <ThemeProvider
          lightTheme={{ interactiveAccentDefault: "custom-light" }}
          darkTheme={{ interactiveAccentDefault: "custom-dark" }}
        >
          <span>content</span>
        </ThemeProvider>
      </ColorSchemeProvider>,
    );

    expect(html).toContain(":root[data-openui-color-scheme=light] body");
    expect(html).toContain(":root[data-openui-color-scheme=dark] body");
    expect(html).toContain(
      "@media (prefers-color-scheme: dark) {\n:root:not([data-openui-color-scheme]) body",
    );
    expect(html).toContain("custom-light");
    expect(html).toContain("custom-dark");
    expect(html).toMatch(/:root\[data-openui-color-scheme=light\] \.openui-theme-portal-[^,\s{]+/);
    expect(html).toMatch(/:root\[data-openui-color-scheme=dark\] \.openui-theme-portal-[^,\s{]+/);
  });

  it("resets light-only overrides when darkTheme is independent", () => {
    const html = renderToString(
      <ColorSchemeProvider>
        <ThemeProvider
          lightTheme={{ background: "light-only-background" }}
          darkTheme={{ interactiveAccentDefault: "dark-only-accent" }}
        >
          <span />
        </ThemeProvider>
      </ColorSchemeProvider>,
    );

    const darkRule = html.match(
      /:root\[data-openui-color-scheme=dark\] body[\s\S]*?\{([\s\S]*?)\}/,
    )?.[1];
    expect(darkRule).toContain(`--openui-background: ${defaultDarkTheme.background};`);
    expect(darkRule).toContain("--openui-interactive-accent-default: dark-only-accent;");
    expect(darkRule).not.toContain("light-only-background");
  });

  it("keeps an explicit mode server-resolved even inside the root provider", () => {
    let observedMode: string | undefined;
    const Probe = () => {
      observedMode = useTheme().mode;
      return null;
    };

    const html = renderToString(
      <ColorSchemeProvider>
        <ThemeProvider
          mode="dark"
          lightTheme={{ interactiveAccentDefault: "forced-light" }}
          darkTheme={{ interactiveAccentDefault: "forced-dark" }}
        >
          <Probe />
        </ThemeProvider>
      </ColorSchemeProvider>,
    );

    expect(observedMode).toBe("dark");
    expect(html).toContain("forced-dark");
    expect(html).not.toContain("forced-light");
    expect(html).not.toContain(":root[data-openui-color-scheme=dark] body");
    expect(html).not.toContain("&quot;");
  });

  it("allows a nested forced scope to override an opposite explicit root", () => {
    const html = renderToString(
      <ThemeProvider mode="dark" darkTheme={{ interactiveAccentDefault: "outer-dark" }}>
        <ThemeProvider mode="light" lightTheme={{ interactiveAccentDefault: "inner-light" }}>
          <span>nested</span>
        </ThemeProvider>
      </ThemeProvider>,
    );

    expect(html).toContain("outer-dark");
    expect(html).toContain("inner-light");
    expect(html).toMatch(
      /\.openui-theme-[^,\s{]+,\n\.openui-theme-portal-[^,\s{]+ \{[\s\S]*?inner-light/,
    );
  });

  it("renders both themes for a nested scope inheriting the root preference", () => {
    const html = renderToString(
      <ColorSchemeProvider>
        <ThemeProvider>
          <ThemeProvider
            lightTheme={{ interactiveAccentDefault: "nested-light" }}
            darkTheme={{ interactiveAccentDefault: "nested-dark" }}
          >
            <span>nested</span>
          </ThemeProvider>
        </ThemeProvider>
      </ColorSchemeProvider>,
    );

    expect(html).toMatch(/:root\[data-openui-color-scheme=light\] \.openui-theme-[^,\s{]+/);
    expect(html).toMatch(/:root\[data-openui-color-scheme=dark\] \.openui-theme-[^,\s{]+/);
    expect(html).toContain("nested-light");
    expect(html).toContain("nested-dark");
  });

  it("prefixes every top-level explicit selector without splitting functional selectors", () => {
    const html = renderToString(
      <ColorSchemeProvider>
        <ThemeProvider
          cssSelector={'main, :is(.panel, [data-kind="a,b"]), :root[data-app]'}
          lightTheme={{ background: "selector-light" }}
          darkTheme={{ background: "selector-dark" }}
        >
          <span />
        </ThemeProvider>
      </ColorSchemeProvider>,
    );

    expect(html).toContain(":root[data-openui-color-scheme=dark] main");
    expect(html).toContain(
      ":root[data-openui-color-scheme=dark] :is(.panel, [data-kind=\\61 \\2c \\62 ])",
    );
    expect(html).toContain(":root[data-openui-color-scheme=dark][data-app]");
    expect(html).not.toContain(
      ":is(.panel, :root[data-openui-color-scheme=dark] [data-kind=\\61 \\2c \\62 ])",
    );
  });

  it("preserves CSS escape semantics while making quoted selectors React 18 safe", () => {
    const html = renderToString(
      <ColorSchemeProvider>
        <ThemeProvider cssSelector={'[data-kind="a\\2c b"]'} lightTheme={{ background: "safe" }}>
          <span />
        </ThemeProvider>
      </ColorSchemeProvider>,
    );

    expect(html).toContain("[data-kind=\\61 \\2c \\62 ]");
    expect(html).not.toContain("&quot;");
  });

  it("applies a CSP nonce and cannot turn a hostile token value into markup", () => {
    const html = renderToString(
      <ThemeProvider
        mode="light"
        nonce="theme-nonce"
        lightTheme={{
          interactiveAccentDefault: "red;}</style><script>globalThis.pwned=true</script><style>{",
        }}
      >
        <span />
      </ThemeProvider>,
    );

    expect(html).toContain('nonce="theme-nonce"');
    expect(html).not.toContain("</style><script>globalThis.pwned=true</script>");
    expect(html).toContain("</\\73 tyle><script>globalThis.pwned=true</script>");
    expect(html.match(/<\/style>/g)).toHaveLength(1);
  });

  it("gives JavaScript theme consumers a light SSR fallback marked as unresolved", () => {
    let observed:
      | { mode: string; isModeServerResolved: boolean; palette: readonly string[] }
      | undefined;
    const Probe = () => {
      const { isModeServerResolved, mode } = useTheme();
      const palette = useChartPalette({
        chartThemeName: "ocean",
        themePaletteName: "barChartPalette",
        dataLength: 1,
      });
      observed = { mode, isModeServerResolved, palette };
      return null;
    };

    renderToString(
      <ColorSchemeProvider>
        <ThemeProvider
          lightTheme={{ barChartPalette: ["light-palette"] }}
          darkTheme={{ barChartPalette: ["dark-palette"] }}
        >
          <Probe />
        </ThemeProvider>
      </ColorSchemeProvider>,
    );

    expect(observed).toEqual({
      mode: "light",
      isModeServerResolved: false,
      palette: ["light-palette"],
    });
  });

  it("marks a server-readable root preference as resolved for JavaScript consumers", () => {
    let observed: { mode: string; isModeServerResolved: boolean } | undefined;
    const Probe = () => {
      const { isModeServerResolved, mode } = useTheme();
      observed = { mode, isModeServerResolved };
      return null;
    };

    renderToString(
      <ColorSchemeProvider serverMode="dark">
        <ThemeProvider>
          <Probe />
        </ThemeProvider>
      </ColorSchemeProvider>,
    );

    expect(observed).toEqual({ mode: "dark", isModeServerResolved: true });
  });

  it("renders both syntax themes for CSS selection when client preference is unknown", () => {
    const markdown = "```js\nconst answer = 42;\n```";
    const inheritedHtml = renderToString(
      <ColorSchemeProvider>
        <ThemeProvider>
          <MarkDownRenderer textMarkdown={markdown} />
        </ThemeProvider>
      </ColorSchemeProvider>,
    );
    expect(inheritedHtml).toContain('class="openui-color-scheme-light-only"');
    expect(inheritedHtml).toContain('class="openui-color-scheme-dark-only"');

    const explicitHtml = renderToString(
      <ThemeProvider mode="dark">
        <MarkDownRenderer textMarkdown={markdown} />
      </ThemeProvider>,
    );
    expect(explicitHtml).not.toContain("openui-color-scheme-light-only");
    expect(explicitHtml).not.toContain("openui-color-scheme-dark-only");
  });
});
