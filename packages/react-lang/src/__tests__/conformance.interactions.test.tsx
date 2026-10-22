// @vitest-environment jsdom
// The interactions.json part of the spec/fixtures/1.0 conformance cases (README, "Action and form cases"),
// run through <Renderer>. lang-core's conformance.test.ts checks their expected.json.
import {
  createLibrary,
  defineAction,
  defineComponent,
  markReactive,
  type ActionEvent,
  type Store,
} from "@openuidev/lang-core";
import fs from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterAll, describe, expect, it } from "vitest";
import * as z from "zod/v4";
import { FormNameContext, useFormName, useOpenUI } from "../context";
import { useStateField } from "../hooks/useStateField";
import type { ComponentRenderer, Library } from "../library";
import { Renderer } from "../Renderer";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Dict = Record<string, unknown>;
type Params = { properties?: Dict };

const FIXTURES = path.resolve(
  process.env.OPENUI_FIXTURES ?? path.join(__dirname, "../../../../spec/fixtures/1.0"),
);
const read = (...p: string[]) => fs.readFileSync(path.join(FIXTURES, ...p), "utf8");
const dirs = (...p: string[]) =>
  fs
    .readdirSync(path.join(FIXTURES, ...p), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
const spec = JSON.parse(read("library.json")) as {
  root: string;
  schema: { $defs: Record<string, Params>; actions?: Record<string, { params: Params }> };
  components: Record<string, { signature: string; description: string }>;
};

// ─── Test renderers; each registers its handlers by statement id ───

let clicks = new Map<string, () => unknown>();
let inputs = new Map<string, (text: string) => void>();
const live: { store: Store | null } = { store: null };

/** useOpenUI, also keeping the store so the runner can read state at the end. */
function useCtx() {
  const ctx = useOpenUI();
  live.store = ctx.store;
  return ctx;
}

const Generic: ComponentRenderer<Dict> = ({ props, renderNode }) => {
  useCtx();
  return (
    <div>
      {Object.values(props).map((v, i) => (
        <React.Fragment key={i}>{renderNode(v)}</React.Fragment>
      ))}
    </div>
  );
};

const RENDERERS: Record<string, ComponentRenderer<Dict>> = {
  Form: ({ props, renderNode }) => (
    <FormNameContext.Provider value={props.name as string}>
      <form>{renderNode(props.children)}</form>
    </FormNameContext.Provider>
  ),
  Input: ({ props, statementId }) => {
    const ctx = useCtx();
    const formName = useFormName();
    const field = useStateField(props.name as string, props.value);
    // A form field records its componentType; a bound $variable takes the plain value.
    inputs.set(statementId!, (text) =>
      field.isReactive
        ? field.setValue(text)
        : ctx.setFieldValue(formName, "input", props.name as string, text),
    );
    return <input readOnly value={String(field.value ?? "")} />;
  },
  Button: ({ props, statementId }) => {
    const ctx = useCtx();
    const formName = useFormName();
    clicks.set(statementId!, () =>
      ctx.triggerAction(props.label as string, formName, props.action as never),
    );
    return <button>{String(props.label)}</button>;
  },
};

// ─── The test library from library.json ───

// Only the prop keys matter here, with the reactive mark on bindable props.
function props({ properties = {} }: Params, bindable = new Set<string>()) {
  const shape = Object.keys(properties).map((key) => {
    const s = z.any();
    if (bindable.has(key)) markReactive(s);
    return [key, s];
  });
  return z.object(Object.fromEntries(shape));
}

const library = {
  ...createLibrary({
    components: Object.entries(spec.components).map(([name, { signature, description }]) =>
      defineComponent({
        name,
        description,
        props: props(
          spec.schema.$defs[name],
          new Set([...signature.matchAll(/(\w+)\??: \$binding</g)].map((m) => m[1])),
        ),
        component: RENDERERS[name] ?? Generic,
      }),
    ),
    actions: Object.entries(spec.schema.actions ?? {}).map(([name, a]) =>
      defineAction({ name, description: "", params: props(a.params) }),
    ) as never,
    root: spec.root,
  }),
  toJSONSchema: () => spec.schema,
} as unknown as Library;

// ─── Running a case ───

const json = (v: unknown) => (v === undefined ? null : JSON.parse(JSON.stringify(v)));
const same = (a: unknown, b: unknown) => isDeepStrictEqual(json(a), json(b));
const str = JSON.stringify;

async function settle() {
  for (let i = 0; i < 5; i++) await act(() => new Promise((r) => setTimeout(r, 0)));
}

async function runInteractions(
  program: string,
  { interactions: steps, expected }: { interactions: Dict[]; expected: Dict },
) {
  clicks = new Map();
  inputs = new Map();
  live.store = null;
  const events: Dict[] = [];
  const toolCalls: Dict[] = [];
  const tools: Record<string, (args: Dict) => Promise<unknown>> = {};
  const setTool = (name: string, result: unknown) => {
    tools[name] = async (args) => (toolCalls.push({ tool: name, args: json(args) }), json(result));
  };
  // Tool steps before the first user step apply before the program mounts.
  let i = 0;
  for (; i < steps.length && "tool" in steps[i]; i++)
    setTool(steps[i].tool as string, steps[i].result);

  const root = createRoot(document.createElement("div"));
  const diffs: string[] = [];
  try {
    await act(async () =>
      root.render(
        <Renderer
          response={program}
          library={library}
          isStreaming={false}
          onAction={(e: ActionEvent) => events.push(e as unknown as Dict)}
          toolProvider={tools}
        />,
      ),
    );
    await settle();
    for (; i < steps.length; i++) {
      const s = steps[i];
      if ("tool" in s) {
        setTool(s.tool as string, s.result);
        continue;
      }
      const [id, text] = "type" in s ? (s.type as [string, string]) : [s.click as string, ""];
      const handler = "type" in s ? inputs.get(id) : clicks.get(id);
      if (!handler) {
        diffs.push(`step ${i}: nothing rendered for ${id}`);
        break;
      }
      await act(async () => void (await handler(text)));
      await settle();
    }

    // Each expected event is compared on the keys it lists; null means absent or null.
    const want = (expected.events as Dict[]) ?? [];
    const eventsOk =
      want.length === events.length &&
      want.every((w, k) => Object.entries(w).every(([key, v]) => same(v, events[k][key])));
    if (!eventsOk) diffs.push(`events: expected ${str(want)}, got ${str(json(events))}`);
    for (const [key, v] of Object.entries((expected.state as Dict) ?? {})) {
      const got = (live.store as Store | null)?.get(key); // set while rendering
      if (!same(v, got)) diffs.push(`state ${key}: expected ${str(v)}, got ${str(got)}`);
    }
    // Consecutive identical calls count once.
    const calls = toolCalls.filter((c, k) => k === 0 || !same(c, toolCalls[k - 1]));
    if (expected.toolCalls && !same(expected.toolCalls, calls))
      diffs.push(`toolCalls: expected ${str(expected.toolCalls)}, got ${str(calls)}`);
  } finally {
    await act(async () => root.unmount());
  }
  return diffs;
}

// ─── Registration ───

const results: Record<string, { status: string; diffs?: string[] }> = {};

describe("OpenUI conformance fixtures (interactions)", () => {
  for (const area of dirs()) {
    for (const name of dirs(area)) {
      if (!fs.existsSync(path.join(FIXTURES, area, name, "interactions.json"))) continue;
      const id = `${area}/${name}#interactions`;
      it(id, async () => {
        const diffs = await runInteractions(
          read(area, name, "input.oui"),
          JSON.parse(read(area, name, "interactions.json")),
        );
        results[id] = diffs.length ? { status: "fail", diffs } : { status: "pass" };
        if (diffs.length) expect.fail(`${id}\n  ${diffs.join("\n  ")}`);
      });
    }
  }

  // OPENUI_CONFORMANCE_REPORT=<file> writes `<file>.interactions.json`: `{ "<id>": { status, diffs? } }`.
  afterAll(() => {
    const report = process.env.OPENUI_CONFORMANCE_REPORT;
    if (report) {
      fs.writeFileSync(
        report.replace(/(\.json)?$/, ".interactions.json"),
        JSON.stringify(results, null, 2) + "\n",
      );
    }
  });
});
