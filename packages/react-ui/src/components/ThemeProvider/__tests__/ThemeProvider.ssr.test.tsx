import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { defaultDarkTheme, defaultLightTheme } from "../defaultTheme";
import { ThemeProvider } from "../ThemeProvider";

const STYLE_TAG_RE = /<style data-openui-theme="([^"]*)">([\s\S]*?)<\/style>/g;

describe("ThemeProvider SSR", () => {
  it("renders a style tag pinning dark tokens on body for mode=dark", () => {
    const html = renderToString(
      <ThemeProvider mode="dark">
        <div>app</div>
      </ThemeProvider>,
    );

    expect(html).toContain('<style data-openui-theme="');
    expect(html).toMatch(/<style data-openui-theme="[^"]*">body, \.openui-theme-portal-/);
    expect(html).toContain(`--openui-background: ${defaultDarkTheme.background}`);
    expect(html).not.toContain("@media");
    // Style parses before children paint.
    expect(html.indexOf("<style")).toBeLessThan(html.indexOf("app"));
  });

  it("defaults to light tokens on body when mode is unset", () => {
    const html = renderToString(
      <ThemeProvider>
        <div>app</div>
      </ThemeProvider>,
    );

    expect(html).toMatch(/<style data-openui-theme="[^"]*">body, \.openui-theme-portal-/);
    expect(html).toContain(`--openui-background: ${defaultLightTheme.background}`);
    expect(html).not.toContain("@media");
  });

  it("emits all four rule groups for mode=system", () => {
    const html = renderToString(
      <ThemeProvider mode="system">
        <div>app</div>
      </ThemeProvider>,
    );

    const baseStart = html.indexOf("body, .openui-theme-portal-");
    const mediaStart = html.indexOf("@media (prefers-color-scheme: dark)");
    const lightAttrStart = html.indexOf('[data-openui-mode="light"] body');
    const darkAttrStart = html.indexOf('[data-openui-mode="dark"] body');

    expect(baseStart).toBeGreaterThan(-1);
    expect(mediaStart).toBeGreaterThan(baseStart);
    expect(lightAttrStart).toBeGreaterThan(mediaStart);
    expect(darkAttrStart).toBeGreaterThan(lightAttrStart);
    // Attribute groups also match the scope element carrying the attribute itself.
    expect(html).toContain('body[data-openui-mode="light"]');
    expect(html).toContain('body[data-openui-mode="dark"]');
  });

  it("includes custom lightTheme override values in the rendered tag", () => {
    const html = renderToString(
      <ThemeProvider lightTheme={{ interactiveAccentDefault: "oklch(0.6 0.2 260)" }}>
        <div>app</div>
      </ThemeProvider>,
    );

    expect(html).toContain("--openui-interactive-accent-default: oklch(0.6 0.2 260)");
  });

  it("places darkTheme overrides inside the media block for mode=system", () => {
    const html = renderToString(
      <ThemeProvider mode="system" darkTheme={{ background: "oklch(0.1 0 0)" }}>
        <div>app</div>
      </ThemeProvider>,
    );

    const mediaStart = html.indexOf("@media (prefers-color-scheme: dark)");
    const mediaEnd = html.indexOf('[data-openui-mode="light"]');
    const mediaBlock = html.slice(mediaStart, mediaEnd);

    expect(mediaBlock).toContain("--openui-background: oklch(0.1 0 0)");
    // The default (light) group before the media block keeps the light value.
    expect(html.slice(0, mediaStart)).not.toContain("oklch(0.1 0 0)");
  });

  it("scopes a nested provider's style tag to the generated class, not body", () => {
    const html = renderToString(
      <ThemeProvider mode="light">
        <ThemeProvider mode="dark">
          <span>inner</span>
        </ThemeProvider>
      </ThemeProvider>,
    );

    const tags = [...html.matchAll(STYLE_TAG_RE)];
    expect(tags).toHaveLength(2);

    const innerCss = tags[1]?.[2] ?? "";
    expect(innerCss).toMatch(/^\.openui-theme-/);
    const innerSelectors = innerCss.slice(0, innerCss.indexOf("{"));
    expect(innerSelectors).not.toContain("body");

    const scopedClass = /^\.(openui-theme-[A-Za-z0-9_-]+)/.exec(innerCss)?.[1] ?? "";
    expect(html).toContain(`class="${scopedClass}"`);
  });

  it("lets a nested provider inherit mode=system from its parent", () => {
    const html = renderToString(
      <ThemeProvider mode="system">
        <ThemeProvider>
          <span>inner</span>
        </ThemeProvider>
      </ThemeProvider>,
    );

    const tags = [...html.matchAll(STYLE_TAG_RE)];
    expect(tags).toHaveLength(2);
    expect(tags[1]?.[2]).toContain("@media (prefers-color-scheme: dark)");
  });
});
