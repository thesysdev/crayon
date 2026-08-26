import { ChatProvider } from "@openuidev/react-headless";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeMockLLM } from "../../../__test-helpers/mockChat";
import { DesktopWelcomeComposer } from "../components/DesktopWelcomeComposer";

const render = (ui: React.ReactElement) =>
  renderToString(<ChatProvider llm={makeMockLLM()}>{ui}</ChatProvider>);

describe("DesktopWelcomeComposer SSR", () => {
  it("stays uncontrolled by default — empty draft, no drafting attr", () => {
    const html = render(<DesktopWelcomeComposer />);
    expect(html).toContain("openui-agent-desktop-welcome-composer");
    expect(html).not.toContain("data-drafting");
  });

  it("renders the controlled value", () => {
    const html = render(
      <DesktopWelcomeComposer value="Create a presentation about " onChange={() => undefined} />,
    );
    expect(html).toContain("Create a presentation about ");
  });

  it("computes drafting from the controlled value when not overridden", () => {
    const html = render(<DesktopWelcomeComposer value="hello" onChange={() => undefined} />);
    expect(html).toContain("data-drafting");
  });

  it("honors the drafting override (chip-prefilled draft must not fade starters)", () => {
    const html = render(
      <DesktopWelcomeComposer value="hello" onChange={() => undefined} drafting={false} />,
    );
    expect(html).not.toContain("data-drafting");
  });
});
