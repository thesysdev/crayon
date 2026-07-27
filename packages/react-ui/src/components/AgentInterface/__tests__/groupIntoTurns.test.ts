import { describe, expect, it } from "vitest";
import type { Message } from "@openuidev/react-headless";
import { groupIntoTurns } from "../Thread";

const u = (id: string): Message => ({ id, role: "user", content: "q" }) as Message;
const a = (id: string): Message => ({ id, role: "assistant", content: "t" }) as Message;
const t = (id: string): Message => ({ id, role: "tool", content: "r", toolCallId: "c" }) as Message;

describe("groupIntoTurns", () => {
  it("groups consecutive assistant/tool messages into one turn", () => {
    const groups = groupIntoTurns([u("u1"), a("a1"), t("t1"), a("a2"), u("u2"), a("a3")]);
    expect(groups.map((g) => g.messages.map((m) => m.id))).toEqual([
      ["u1"],
      ["a1", "t1", "a2"],
      ["u2"],
      ["a3"],
    ]);
    expect(groups.map((g) => g.startIndex)).toEqual([0, 1, 4, 5]);
  });

  it("keeps single-assistant turns intact (no behavior change path)", () => {
    const groups = groupIntoTurns([u("u1"), a("a1"), t("t1")]);
    expect(groups).toHaveLength(2);
    expect(groups[1]!.messages.map((m) => m.id)).toEqual(["a1", "t1"]);
  });
});
