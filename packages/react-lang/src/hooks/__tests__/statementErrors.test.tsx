// @vitest-environment jsdom
import type { OpenUIError } from "@openuidev/lang-core";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";
import { z } from "zod/v4";
import { useTriggerAction } from "../../context";
import { createLibrary, defineComponent, defineFunction } from "../../index";
import { Renderer } from "../../Renderer";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let click: () => void | Promise<void> = () => {};
const Btn = defineComponent({
  name: "Btn",
  description: "",
  props: z.object({ label: z.string(), action: z.any().optional() }),
  component: ({ props }) => {
    const trigger = useTriggerAction();
    click = () => trigger(props.label as string, undefined, props.action as never);
    return null;
  },
});
const percent = defineFunction({
  name: "Percent",
  description: "",
  params: z.object({ part: z.number(), total: z.number() }),
  returns: z.string(),
  fn: ({ part, total }) => `${(part / total) * 100}%`,
});
const library = createLibrary({ components: [Btn], root: "Btn", functions: [percent] });
const toolProvider = { saveProgress: async () => ({}) };

/** Renders the program, clicks the root Btn, and returns the last onError batch. */
async function lastErrors(statements: string[]): Promise<OpenUIError[]> {
  let last: OpenUIError[] = [];
  const root = createRoot(document.createElement("div"));
  await act(async () => {
    root.render(
      <Renderer
        library={library}
        response={statements.join("\n")}
        isStreaming={false}
        toolProvider={toolProvider}
        onError={(errors) => (last = errors)}
      />,
    );
  });
  await act(async () => click());
  act(() => root.unmount());
  return last;
}

const runtime = (errors: OpenUIError[]) => errors.filter((e) => e.code === "runtime-error");

it("reports a bad @Percent in Query args against the query statement", async () => {
  const errors = runtime(
    await lastErrors([
      `root = Btn("go")`,
      `q = Query("saveProgress", { percentage: @Percent("bad", 4) })`,
    ]),
  );
  expect(errors).toHaveLength(1);
  expect(errors[0]).toMatchObject({ source: "runtime", statementId: "q" });
  expect(errors[0].message).toContain("@Percent");
});

it("reports a bad @Percent in Mutation args and in a @Set value on click", async () => {
  const errors = runtime(
    await lastErrors([
      // A literal "bad" here is caught at parse time; state only fails at click time
      `root = Btn("go", Action([@Set($x, @Percent($s, 4)), @Run(m)]))`,
      `$x = ""`,
      `$s = "bad"`,
      `m = Mutation("saveProgress", { percentage: @Percent("bad", 4) })`,
    ]),
  );
  expect(errors.map((e) => [e.statementId, e.message.includes("@Percent")])).toEqual([
    [undefined, true],
    ["m", true],
  ]);
  expect(errors[0].message).toContain("$x");
});

it("a valid program reports nothing", async () => {
  const errors = await lastErrors([
    `root = Btn("go", Action([@Set($x, @Percent(1, 4)), @Run(m)]))`,
    `$x = ""`,
    `q = Query("saveProgress", { percentage: @Percent(3, 4) })`,
    `m = Mutation("saveProgress", { percentage: @Percent(3, 4) })`,
  ]);
  expect(errors).toEqual([]);
});
