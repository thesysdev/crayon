import { ChatProvider } from "@openuidev/react-headless";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeMockLLM } from "../../../__test-helpers/mockChat";
import type { PrefillChip } from "../../../types/PrefillChip";
import { WelcomePrefillChips } from "../components/WelcomePrefillChips";

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

describe("WelcomePrefillChips SSR", () => {
  it("renders the chip row and default starters in layer 1 when draft is empty", () => {
    const html = render(
      <WelcomePrefillChips
        chips={CHIPS}
        starters={STARTERS}
        starterVariant="long"
        draft=""
        selectedChip={null}
        onChipClick={() => undefined}
        onContextualSelect={() => undefined}
        disabled={false}
      />,
    );
    expect(html).toContain("openui-agent-welcome-screen__starters-layers");
    expect(html).toContain("openui-agent-welcome-screen__chip-row");
    expect(html).toContain("openui-agent-prefill-chip");
    expect(html).toContain("Create a presentation");
    expect(html).toContain("Quarterly deck");
    expect(html).not.toContain("data-hidden");
  });

  it("hides layer 1 when drafting and shows contextual starters for the selected chip", () => {
    const html = render(
      <WelcomePrefillChips
        chips={CHIPS}
        starters={STARTERS}
        starterVariant="long"
        draft="Create a presentation about "
        selectedChip={CHIPS[0]!}
        onChipClick={() => undefined}
        onContextualSelect={() => undefined}
        disabled={false}
      />,
    );
    expect(html).toContain("data-hidden");
    expect(html).toContain("Our Q2 business review");
  });

  it("disables chips while running", () => {
    const html = render(
      <WelcomePrefillChips
        chips={CHIPS}
        starters={STARTERS}
        starterVariant="long"
        draft=""
        selectedChip={null}
        onChipClick={() => undefined}
        onContextualSelect={() => undefined}
        disabled={true}
      />,
    );
    expect(html).toContain("disabled");
  });
});
