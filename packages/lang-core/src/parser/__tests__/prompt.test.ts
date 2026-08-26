import { describe, expect, it } from "vitest";
import { generatePrompt } from "../prompt";

describe("generatePrompt", () => {
  it("does not inject Stack when it is absent from the component catalog", () => {
    const prompt = generatePrompt({
      root: "Card",
      components: {
        Card: {
          signature: 'Card(children: Component[], variant?: "card" | "clear")',
        },
      },
      tools: ["list_items"],
      editMode: true,
    });

    expect(prompt).not.toContain("Stack");
    expect(prompt).toContain(
      "Arguments are POSITIONAL (order matters, not names). Follow each component signature's argument order",
    );
  });
});
