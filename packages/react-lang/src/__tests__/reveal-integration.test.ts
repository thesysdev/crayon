import { createStreamingParser } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { createLibrary, defineComponent } from "../library";
import { DEFAULT_REVEAL_RATE, revealDurationMs, revealedCountAt } from "../reveal";

// Components never render in a parser-level test — a trivial FC satisfies the type.
const Dummy = () => null;

const Section = defineComponent({
  name: "Section",
  props: z.object({ title: z.string(), children: z.array(z.any()) }),
  description: "A section with children",
  component: Dummy,
});
const Card = defineComponent({
  name: "Card",
  props: z.object({ label: z.string() }),
  description: "A card",
  component: Dummy,
});
const library = createLibrary({ components: [Section, Card], root: "Section" });
const schema = library.toJSONSchema();

// Ref-list-first DSL: the root line lists its children, so appending a child
// rewrites the root line — the string is NON-monotonic, the exact shape a naive
// prefix reveal blanks-and-rebuilds on.
const DSL = [
  'root = Section("Weekly review", [b0, b1])',
  'b0 = Card("Invoices")',
  'b1 = Card("Alerts")',
].join("\n");

function fullParse() {
  return createStreamingParser(schema, "Section").set(DSL);
}

describe("revealRate mechanism — a clock-paced prefix drives real assembly", () => {
  it("a full parse resolves the whole tree", () => {
    const full = fullParse();
    expect(full.root).not.toBeNull();
    expect(full.meta.incomplete).toBe(false);
    expect(full.meta.unresolved).toEqual([]);
    expect(full.meta.statementCount).toBe(3); // root + b0 + b1
  });

  it("reveals nothing at elapsed 0", () => {
    const sp = createStreamingParser(schema, "Section");
    const count = revealedCountAt(
      0,
      DSL.length,
      0,
      revealDurationMs(DSL.length, DEFAULT_REVEAL_RATE),
    );
    expect(count).toBe(0);
    expect(sp.set(DSL.slice(0, count)).root).toBeNull();
  });

  it("feeding the real parser clock-paced growing prefixes assembles the UI and never blanks", () => {
    const finalStmt = fullParse().meta.statementCount;
    const sp = createStreamingParser(schema, "Section");
    const durationMs = revealDurationMs(DSL.length, DEFAULT_REVEAL_RATE);

    let prevStmt = -1;
    let sawRoot = false;
    let sawPartialAssembly = false; // root present while the tree is still filling in

    const STEPS = 60;
    for (let i = 0; i <= STEPS; i++) {
      const elapsed = (durationMs * i) / STEPS;
      const count = revealedCountAt(0, DSL.length, elapsed, durationMs);
      const r = sp.set(DSL.slice(0, count));

      // Never blanks: the completed-statement count is monotonic non-decreasing
      // across the whole reveal — a completed component is never un-rendered.
      expect(r.meta.statementCount).toBeGreaterThanOrEqual(prevStmt);
      prevStmt = r.meta.statementCount;

      if (r.root) {
        sawRoot = true;
        if (r.meta.statementCount < finalStmt) sawPartialAssembly = true;
      }
    }

    // The root rendered mid-stream, before every statement had completed — i.e.
    // the components genuinely ASSEMBLED rather than popping in only at the end.
    expect(sawRoot).toBe(true);
    expect(sawPartialAssembly).toBe(true);

    // And the paced stream lands exactly where a fresh full parse does.
    const final = sp.set(DSL);
    expect(final.root).not.toBeNull();
    expect(final.meta.incomplete).toBe(false);
    expect(final.meta.unresolved).toEqual([]);
    expect(final.meta.statementCount).toBe(finalStmt);
  });
});
