import {
  createStore,
  createStreamingParser,
  evaluateElementProps,
} from "@openuidev/lang-core";
import { render } from "ink-testing-library";
import { createElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { RenderValue } from "../genui/components.js";
import { TuiProvider, type TuiContextValue } from "../genui/context.js";
import { tuiLibrary } from "../genui/library.js";
import { useGenUi } from "../genui/state.js";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Parse + evaluate an OpenUI Lang program with the TUI library. */
function evalProgram(src: string) {
  const sp = createStreamingParser(tuiLibrary.toJSONSchema(), tuiLibrary.root);
  const pr = sp.set(src);
  const store = createStore();
  store.initialize(pr.stateDeclarations ?? {}, {});
  const root = pr.root
    ? evaluateElementProps(pr.root, {
        ctx: { getState: (n) => store.get(n), resolveRef: () => undefined },
        library: tuiLibrary,
        store,
        errors: [],
      })
    : null;
  return root;
}

const noopCtx: TuiContextValue = {
  library: tuiLibrary,
  interactive: true,
  triggerAction: () => {},
  getFieldValue: () => undefined,
  setFieldValue: () => {},
};

/** Drives the real state hook (parse → evaluate → action loop), no LLM/react-headless. */
function Harness({ src, onSend }: { src: string; onSend: (c: string) => void }): ReactNode {
  const { result, ctx } = useGenUi(tuiLibrary, "m1", src, false, onSend);
  return createElement(
    TuiProvider,
    { value: ctx },
    result?.root ? createElement(RenderValue, { value: result.root }) : null,
  );
}

describe("TUI renderer", () => {
  it("renders header, bar chart and table from streamed OpenUI Lang", () => {
    const src = [
      "root = Card([h, chart, tbl])",
      'h = CardHeader("Setup Status", "All green")',
      'chart = BarChart(["lang-core", "react-headless"], [s1], "Package", "Tests")',
      's1 = Series("Tests", [68, 70])',
      "tbl = Table([c1, c2])",
      'c1 = Col("Step", ["install", "build"])',
      'c2 = Col("Result", ["ok", "ok"])',
    ].join("\n");

    const root = evalProgram(src);
    const { lastFrame } = render(
      createElement(TuiProvider, { value: noopCtx }, createElement(RenderValue, { value: root })),
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("Setup Status");
    expect(frame).toContain("All green");
    expect(frame).toContain("█"); // chart bars
    expect(frame).toContain("Step"); // table header
    expect(frame).toContain("install"); // table cell
    expect(frame).toContain("react-headless");
  });

  it("renders unknown components as a visible marker instead of crashing", () => {
    const root = evalProgram('root = Card([x])\nx = TextContent("hello world")');
    const { lastFrame } = render(
      createElement(TuiProvider, { value: noopCtx }, createElement(RenderValue, { value: root })),
    );
    expect(lastFrame() ?? "").toContain("hello world");
  });

  it("renders finalized turns display-only (buttons are not interactive)", () => {
    const root = evalProgram(
      'root = Card([btns])\nbtns = Buttons([b1])\nb1 = Button("Retry", Action([@ToAssistant("retry")]))',
    );
    const staticCtx: TuiContextValue = { ...noopCtx, interactive: false };
    const { lastFrame } = render(
      createElement(TuiProvider, { value: staticCtx }, createElement(RenderValue, { value: root })),
    );
    expect(lastFrame() ?? "").toContain("[ Retry ]");
  });
});

describe("TUI interactivity", () => {
  it("sends a follow-up's text to the assistant on Enter", async () => {
    const sent: string[] = [];
    const src = [
      "root = Card([fu])",
      "fu = FollowUpBlock([f1])",
      'f1 = FollowUpItem("Show this as a table")',
    ].join("\n");

    const { stdin } = render(createElement(Harness, { src, onSend: (c) => sent.push(c) }));
    await delay(30);
    stdin.write("\t"); // focus the follow-up
    await delay(30);
    stdin.write("\r"); // activate it
    await delay(30);

    expect(sent).toContain("Show this as a table");
  });

  it("collects form field values and submits them via the button's action", async () => {
    const sent: string[] = [];
    const src = [
      "root = Card([form])",
      "form = Form(\"contact\", btns, [nameField])",
      'nameField = FormControl("Name", nameInput)',
      'nameInput = Input("name", "Your name")',
      "btns = Buttons([submit])",
      'submit = Button("Send", Action([@ToAssistant("Contact submitted")]))',
    ].join("\n");

    const { stdin } = render(createElement(Harness, { src, onSend: (c) => sent.push(c) }));
    await delay(30);
    stdin.write("\t"); // focus the name input
    await delay(20);
    for (const ch of "Ada") {
      stdin.write(ch);
      await delay(5);
    }
    stdin.write("\t"); // focus the submit button
    await delay(20);
    stdin.write("\r"); // submit
    await delay(30);

    expect(sent.length).toBe(1);
    expect(sent[0]).toContain("Contact submitted");
    expect(sent[0]).toContain('"name":"Ada"');
  });
});
