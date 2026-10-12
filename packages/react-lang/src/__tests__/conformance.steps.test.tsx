// @vitest-environment jsdom
// The steps.json part of the spec/fixtures conformance cases (README, "Action and form cases"),
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
type Schema = { type?: string; properties?: Record<string, Schema>; required?: string[] };

const FIXTURES = path.resolve(
  process.env.OPENUI_FIXTURES ?? path.join(__dirname, "../../../../spec/fixtures"),
);
const readJSON = (...p: string[]) => JSON.parse(fs.readFileSync(path.join(FIXTURES, ...p), "utf8"));
const spec = readJSON("library.json") as {
  root: string;
  schema: { $defs: Record<string, Schema>; actions?: Record<string, { params: Schema }> };
  components: Record<string, { signature: string; description: string }>;
};
const knownFailing = readJSON("known-failing.json") as Record<string, string>;

// ─── Test renderers; each registers its handlers by statement id ───

let clicks = new Map<string, () => unknown>();
let inputs = new Map<string, (text: string) => void>();
const live: { store: Store | null } = { store: null };

const Generic: ComponentRenderer<Dict> = ({ props, renderNode }) => {
  live.store = useOpenUI().store;
  return (
    <div>
      {Object.values(props).map((v, i) => (
        <React.Fragment key={i}>{renderNode(v)}</React.Fragment>
      ))}
    </div>
  );
};

const FormR: ComponentRenderer<Dict> = ({ props, renderNode }) => (
  <FormNameContext.Provider value={props.name as string}>
    <form>{renderNode(props.children)}</form>
  </FormNameContext.Provider>
);

const InputR: ComponentRenderer<Dict> = ({ props, statementId }) => {
  const ctx = useOpenUI();
  live.store = ctx.store;
  const formName = useFormName();
  const field = useStateField(props.name as string, props.value);
  inputs.set(statementId!, (text) =>
    field.isReactive
      ? field.setValue(text)
      : ctx.setFieldValue(formName, "input", props.name as string, text),
  );
  return <input readOnly value={String(field.value ?? "")} />;
};

const ButtonR: ComponentRenderer<Dict> = ({ props, statementId }) => {
  const ctx = useOpenUI();
  live.store = ctx.store;
  const formName = useFormName();
  clicks.set(statementId!, () =>
    ctx.triggerAction(props.label as string, formName, props.action as never),
  );
  return <button>{String(props.label)}</button>;
};

const RENDERERS: Record<string, ComponentRenderer<Dict>> = {
  Form: FormR,
  Input: InputR,
  Button: ButtonR,
};

// ─── The test library from library.json ───

function toZodObject(json: Schema, bindable: Set<string> = new Set()) {
  const shape: Record<string, z.ZodType> = {};
  for (const [key, prop] of Object.entries(json.properties ?? {})) {
    let s: z.ZodType = prop.type === "string" ? z.string() : z.any();
    if (!json.required?.includes(key)) s = s.optional();
    if (bindable.has(key)) markReactive(s);
    shape[key] = s;
  }
  return z.object(shape);
}

const library = {
  ...createLibrary({
    components: Object.entries(spec.components).map(([name, { signature, description }]) =>
      defineComponent({
        name,
        description,
        props: toZodObject(
          spec.schema.$defs[name],
          new Set([...signature.matchAll(/(\w+)\??: \$binding</g)].map((m) => m[1])),
        ),
        component: RENDERERS[name] ?? Generic,
      }),
    ),
    actions: Object.entries(spec.schema.actions ?? {}).map(([name, a]) =>
      defineAction({ name, description: "", params: toZodObject(a.params) }),
    ) as never,
    root: spec.root,
  }),
  toJSONSchema: () => spec.schema,
} as unknown as Library;

// ─── Running a case ───

const json = (v: unknown) => (v === undefined ? null : JSON.parse(JSON.stringify(v)));
const same = (a: unknown, b: unknown) => isDeepStrictEqual(json(a), json(b));

async function settle() {
  for (let i = 0; i < 5; i++) await act(() => new Promise((r) => setTimeout(r, 0)));
}

async function runSteps(program: string, { steps, expected }: { steps: Dict[]; expected: Dict }) {
  clicks = new Map();
  inputs = new Map();
  const events: ActionEvent[] = [];
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
          onAction={(e) => events.push(e)}
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
    const got = events as unknown as Dict[];
    const eventsOk =
      want.length === got.length &&
      want.every((w, k) => Object.entries(w).every(([key, v]) => same(v, got[k][key] ?? null)));
    if (!eventsOk)
      diffs.push(`events: expected ${JSON.stringify(want)}, got ${JSON.stringify(json(events))}`);
    for (const [key, v] of Object.entries((expected.state as Dict) ?? {})) {
      const value = live.store?.get(key);
      if (!same(v, value ?? null))
        diffs.push(`state ${key}: expected ${JSON.stringify(v)}, got ${JSON.stringify(value)}`);
    }
    // Consecutive identical calls count once.
    const calls = toolCalls.filter((c, k) => k === 0 || !same(c, toolCalls[k - 1]));
    if (expected.toolCalls && !same(expected.toolCalls, calls)) {
      diffs.push(
        `toolCalls: expected ${JSON.stringify(expected.toolCalls)}, got ${JSON.stringify(toolCalls)}`,
      );
    }
  } finally {
    await act(async () => root.unmount());
  }
  return diffs;
}

// ─── Registration ───

const results: Record<string, { status: string; diffs?: string[] }> = {};

describe("OpenUI conformance fixtures (steps)", () => {
  const dirs = (dir: string) =>
    fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
  for (const area of dirs(FIXTURES)) {
    for (const name of dirs(path.join(FIXTURES, area))) {
      const dir = path.join(FIXTURES, area, name);
      if (!fs.existsSync(path.join(dir, "steps.json"))) continue;
      const id = `${area}/${name}#steps`;
      it(id, async () => {
        const diffs = await runSteps(
          fs.readFileSync(path.join(dir, "input.oui"), "utf8"),
          readJSON(area, name, "steps.json"),
        );
        const listed = id in knownFailing;
        if (!diffs.length) {
          results[id] = { status: listed ? "fixed" : "pass" };
          if (listed) console.warn(`[conformance] ${id} passes: remove it from known-failing.json`);
        } else {
          results[id] = { status: listed ? "known-failing" : "fail", diffs };
          if (!listed) expect.fail(`${id}\n  ${diffs.join("\n  ")}`);
        }
      });
    }
  }

  // OPENUI_CONFORMANCE_REPORT=<file> writes `<file>.steps.json`: `{ "<id>": { status, diffs? } }`.
  afterAll(() => {
    const report = process.env.OPENUI_CONFORMANCE_REPORT;
    if (report) {
      fs.writeFileSync(
        report.replace(/(\.json)?$/, ".steps.json"),
        JSON.stringify(results, null, 2) + "\n",
      );
    }
  });
});
