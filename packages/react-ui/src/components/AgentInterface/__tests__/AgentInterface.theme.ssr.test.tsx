import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeMockLLM } from "../../../__test-helpers/mockChat";
import { useTheme } from "../../ThemeProvider";
import { AgentInterface } from "../AgentInterface";

const ThemeProbe = () => {
  const { mode } = useTheme();
  return <span data-theme-mode={mode} />;
};

const renderAgent = ({ mode, logoUrl }: { mode: "light" | "dark"; logoUrl: string }) =>
  renderToString(
    <AgentInterface
      llm={makeMockLLM()}
      agentName="Hydration repro"
      theme={{ mode }}
      logoUrl={logoUrl}
    >
      <ThemeProbe />
    </AgentInterface>,
  );

describe("AgentInterface controlled theme and logo SSR contract", () => {
  it.each([
    { mode: "light" as const, logoUrl: "/logo-light.svg" },
    { mode: "dark" as const, logoUrl: "/logo-dark.svg" },
  ])("renders the caller-provided $mode logo URL", ({ mode, logoUrl }) => {
    const html = renderAgent({ mode, logoUrl });

    expect(html).toContain(`src="${logoUrl}"`);
    expect(html).toContain(`data-theme-mode="${mode}"`);
    expect(html).toContain('class="openui-agent-sidebar-header__logo"');
  });

  it("reproduces different first-render markup when the caller changes controlled inputs", () => {
    const serverHtml = renderAgent({
      mode: "light",
      logoUrl: "/logo-light.svg",
    });
    const firstClientHtml = renderAgent({
      mode: "dark",
      logoUrl: "/logo-dark.svg",
    });

    expect(serverHtml).toContain('src="/logo-light.svg"');
    expect(firstClientHtml).toContain('src="/logo-dark.svg"');
    expect(firstClientHtml).not.toBe(serverHtml);
  });
});
