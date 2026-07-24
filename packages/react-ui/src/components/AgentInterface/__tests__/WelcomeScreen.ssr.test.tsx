import { ChatProvider } from "@openuidev/react-headless";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeMockLLM } from "../../../__test-helpers/mockChat";
import type { PrefillChip } from "../../../types/PrefillChip";
import { WelcomeScreen } from "../WelcomeScreen";

const CHIPS: PrefillChip[] = [
  {
    displayText: "Create a presentation",
    prompt: "Create a presentation about ",
    starters: [{ displayText: "Our Q2 business review", prompt: "our Q2 business review" }],
  },
];
const STARTERS = [{ displayText: "Quarterly deck", prompt: "Create a Q2 deck." }];

const render = (ui: React.ReactElement) =>
  renderToString(<ChatProvider llm={makeMockLLM()}>{ui}</ChatProvider>);

describe("WelcomeScreen SSR", () => {
  it("renders chips mode: chip row, layers wrapper, empty-draft container attribute", () => {
    const html = render(
      <WelcomeScreen title="Good to see you" starters={STARTERS} prefillChips={CHIPS} />,
    );
    expect(html).toContain("data-has-prefill-chips");
    expect(html).toContain("openui-agent-welcome-screen__starters-layers");
    expect(html).toContain("openui-agent-welcome-screen__chip-row");
    expect(html).toContain("openui-agent-prefill-chip");
    expect(html).toContain("Create a presentation");
    expect(html).toContain("Quarterly deck");
    // Initial draft is empty → no drafting fade.
    expect(html).not.toContain("data-drafting");
  });

  it("keeps the legacy markup when no chips are passed (back-compat)", () => {
    const html = render(<WelcomeScreen title="Hi" starters={STARTERS} />);
    expect(html).toContain("openui-agent-welcome-screen__desktop-starters");
    expect(html).not.toContain("openui-agent-welcome-screen__starters-layers");
    expect(html).not.toContain("data-has-prefill-chips");
    expect(html).not.toContain("openui-agent-prefill-chip");
  });

  it("treats an empty chips array as absent", () => {
    const html = render(<WelcomeScreen title="Hi" starters={STARTERS} prefillChips={[]} />);
    expect(html).not.toContain("openui-agent-welcome-screen__starters-layers");
    expect(html).not.toContain("data-has-prefill-chips");
  });

  it("children mode is untouched by chips plumbing", () => {
    const html = render(
      <WelcomeScreen>
        <div>custom welcome</div>
      </WelcomeScreen>,
    );
    expect(html).toContain("custom welcome");
    expect(html).not.toContain("openui-agent-prefill-chip");
  });
});
