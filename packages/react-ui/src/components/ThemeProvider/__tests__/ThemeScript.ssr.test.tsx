import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ThemeScript } from "../ThemeScript";

describe("ThemeScript SSR", () => {
  it("renders an inline script with the default storage key", () => {
    const html = renderToString(<ThemeScript />);

    expect(html).toContain("<script>");
    expect(html).toContain('localStorage.getItem("openui-theme")');
    expect(html).toContain('setAttribute("data-openui-mode",v)');
  });

  it("uses a custom storageKey", () => {
    const html = renderToString(<ThemeScript storageKey="my-key" />);

    expect(html).toContain('localStorage.getItem("my-key")');
    expect(html).not.toContain("openui-theme");
  });

  it("escapes a hostile storageKey so it cannot close the script tag", () => {
    const hostileKey = "</script><script>alert(1)//";
    const html = renderToString(<ThemeScript storageKey={hostileKey} />);

    expect(html).not.toContain(`</script><script>`);
    // Only the component's own closing tag survives.
    expect(html.match(/<\/script>/g)).toHaveLength(1);
    expect(html).toContain("\\u003c/script>");
  });
});
