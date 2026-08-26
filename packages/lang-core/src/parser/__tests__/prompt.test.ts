import { describe, expect, it } from "vitest";
import { generatePrompt } from "../prompt";

describe("generatePrompt", () => {
  it("keeps positional argument guidance independent of a specific catalog", () => {
    const prompt = generatePrompt({
      root: "Card",
      components: {
        Card: {
          signature: 'Card(children: Component[], variant?: "card" | "clear")',
        },
      },
    });

    expect(prompt).not.toContain("Stack(");
    expect(prompt).toContain(
      "Arguments are POSITIONAL (order matters, not names). Follow each component signature's argument order",
    );
  });
});
