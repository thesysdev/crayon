import { readFileSync } from "node:fs";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { buildColorSchemeScript, ColorSchemeScript } from "../ColorSchemeScript";
import {
  COLOR_SCHEME_ATTRIBUTE,
  createColorSchemeConfig,
  defaultColorSchemeConfig,
  getColorSchemeHtmlProps,
  openuiColorSchemeHtmlProps,
} from "../colorScheme";

type ScriptHarness = {
  attributes: Record<string, string>;
  style: Record<string, string>;
  getItem: ReturnType<typeof vi.fn>;
  matchMedia: ReturnType<typeof vi.fn>;
};

function executeScript(
  config = defaultColorSchemeConfig,
  { storedMode, systemDark = false }: { storedMode?: string; systemDark?: boolean } = {},
): ScriptHarness {
  const attributes: Record<string, string> = {};
  const style: Record<string, string> = {};
  const getItem = vi.fn(() => storedMode ?? null);
  const matchMedia = vi.fn(() => ({ matches: systemDark }));
  const windowMock = { localStorage: { getItem }, matchMedia };
  const documentMock = {
    documentElement: {
      style,
      setAttribute: (name: string, value: string) => {
        attributes[name] = value;
      },
    },
  };

  const run = new Function("window", "document", buildColorSchemeScript(config));
  run(windowMock, documentMock);

  return { attributes, style, getItem, matchMedia };
}

describe("ColorSchemeScript", () => {
  it("selects a persisted scheme before hydration", () => {
    const result = executeScript(defaultColorSchemeConfig, {
      storedMode: "dark",
      systemDark: false,
    });

    expect(result.attributes[COLOR_SCHEME_ATTRIBUTE]).toBe("dark");
    expect(result.style["colorScheme"]).toBe("dark");
  });

  it("resolves a persisted system mode through matchMedia", () => {
    const result = executeScript(defaultColorSchemeConfig, {
      storedMode: "system",
      systemDark: true,
    });

    expect(result.attributes[COLOR_SCHEME_ATTRIBUTE]).toBe("dark");
    expect(result.matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
  });

  it("ignores invalid storage and uses the configured default", () => {
    const config = createColorSchemeConfig({ defaultMode: "dark" });
    const result = executeScript(config, { storedMode: "sepia", systemDark: false });

    expect(result.attributes[COLOR_SCHEME_ATTRIBUTE]).toBe("dark");
  });

  it("forces a scheme without reading storage", () => {
    const config = createColorSchemeConfig({ forcedMode: "light" });
    const result = executeScript(config, { storedMode: "dark", systemDark: true });

    expect(result.attributes[COLOR_SCHEME_ATTRIBUTE]).toBe("light");
    expect(result.getItem).not.toHaveBeenCalled();
  });

  it("treats a server-readable selected mode as authoritative", () => {
    const getItem = vi.fn(() => "light");
    const run = new Function(
      "window",
      "document",
      buildColorSchemeScript(defaultColorSchemeConfig, "dark"),
    );
    const attributes: Record<string, string> = {};
    run(
      {
        localStorage: { getItem },
        matchMedia: () => ({ matches: false }),
      },
      {
        documentElement: {
          style: {},
          setAttribute: (name: string, value: string) => {
            attributes[name] = value;
          },
        },
      },
    );

    expect(attributes[COLOR_SCHEME_ATTRIBUTE]).toBe("dark");
    expect(getItem).not.toHaveBeenCalled();
  });

  it("can leave native color-scheme management disabled", () => {
    const config = createColorSchemeConfig({ defaultMode: "dark", enableColorScheme: false });
    const result = executeScript(config);

    expect(result.attributes[COLOR_SCHEME_ATTRIBUTE]).toBe("dark");
    expect(result.style["colorScheme"]).toBeUndefined();
  });

  it("escapes script-closing configuration and supports a CSP nonce", () => {
    const html = renderToString(
      <ColorSchemeScript
        config={createColorSchemeConfig({ storageKey: '</script><script id="injected">' })}
        nonce="nonce-value"
      />,
    );

    expect(html).toContain('nonce="nonce-value"');
    expect(html).not.toContain('</script><script id="injected">');
    expect(html).toContain("\\u003c/script>");
  });

  it("stays within the agreed uncompressed size budget", () => {
    expect(buildColorSchemeScript(defaultColorSchemeConfig).length).toBeLessThan(1500);
  });

  it("provides no-JavaScript and server-readable html root props", () => {
    expect(openuiColorSchemeHtmlProps).toEqual({ suppressHydrationWarning: true });
    expect(getColorSchemeHtmlProps({ defaultMode: "dark" })).toEqual({
      suppressHydrationWarning: true,
      [COLOR_SCHEME_ATTRIBUTE]: "dark",
    });
    expect(getColorSchemeHtmlProps({}, { mode: "system", systemMode: "dark" })).toEqual({
      suppressHydrationWarning: true,
      [COLOR_SCHEME_ATTRIBUTE]: "dark",
    });
    expect(getColorSchemeHtmlProps({ forcedMode: "light" }, { mode: "dark" })).toEqual({
      suppressHydrationWarning: true,
      [COLOR_SCHEME_ATTRIBUTE]: "light",
    });
  });
});

describe("generated root defaults", () => {
  const defaults = readFileSync(new URL("../../../openui-defaults.scss", import.meta.url), "utf8");

  it("preloads both explicit schemes and a no-attribute system fallback", () => {
    expect(defaults).toContain(':root[data-openui-color-scheme="light"]');
    expect(defaults).toContain(':root[data-openui-color-scheme="dark"]');
    expect(defaults).toContain("@media (prefers-color-scheme: dark)");
    expect(defaults).toContain(":root:not([data-openui-color-scheme])");
  });

  it("leaves native color-scheme opt-in to the serialized configuration", () => {
    expect(defaults).not.toMatch(/^\s*color-scheme\s*:/m);
  });
});
