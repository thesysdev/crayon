import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generatePrompt, generateSystemPrompt, type PromptSpec } from "../index";
import {
  calculateProjectHash,
  calculateSystemPromptConfigHash,
  getToolCountBucket,
  resetTelemetryStateForTests,
} from "../telemetry";

function makeSpec(overrides: Partial<PromptSpec> = {}): PromptSpec {
  return {
    id: "private-library-id",
    root: "Root",
    components: {
      Root: {
        signature: "Root(children: Component[])",
        description: "private-component-description",
      },
    },
    tools: [],
    ...overrides,
  };
}

async function waitForCaptures(fetchMock: ReturnType<typeof vi.fn>, count: number): Promise<void> {
  await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(count));
}

describe("system prompt telemetry", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDoNotTrack = process.env.DO_NOT_TRACK;
  const originalDisabled = process.env.OPENUI_TELEMETRY_DISABLED;

  beforeEach(() => {
    process.env.NODE_ENV = "production";
    delete process.env.DO_NOT_TRACK;
    delete process.env.OPENUI_TELEMETRY_DISABLED;
    resetTelemetryStateForTests();
  });

  afterEach(() => {
    resetTelemetryStateForTests();
    vi.unstubAllGlobals();
    process.env.NODE_ENV = originalNodeEnv;
    if (originalDoNotTrack === undefined) delete process.env.DO_NOT_TRACK;
    else process.env.DO_NOT_TRACK = originalDoNotTrack;
    if (originalDisabled === undefined) delete process.env.OPENUI_TELEMETRY_DISABLED;
    else process.env.OPENUI_TELEMETRY_DISABLED = originalDisabled;
  });

  it("uses powers-of-four tool count buckets", () => {
    expect([0, 1, 3, 4, 15, 16, 63, 64].map(getToolCountBucket)).toEqual([
      "0",
      "1-3",
      "1-3",
      "4-15",
      "4-15",
      "16-63",
      "16-63",
      "64+",
    ]);
  });

  it("hashes canonical prompt configuration, independent of declaration order", async () => {
    const first = makeSpec({
      components: {
        Root: { signature: "Root(children: Component[])" },
        Card: { signature: "Card(title: string)", description: "A card" },
      },
      componentGroups: [{ name: "layout", components: ["Root", "Card"] }],
      tools: [
        "search(query: string)",
        {
          name: "save",
          inputSchema: { type: "object", properties: { b: { type: "string" }, a: {} } },
          outputSchema: { type: "object" },
        },
      ],
    });
    const reordered = makeSpec({
      id: "another-private-library-id",
      components: {
        Card: { description: "A card", signature: "Card(title: string)" },
        Root: { signature: "Root(children: Component[])" },
      },
      componentGroups: [{ name: "layout", components: ["Card", "Root"] }],
      tools: [
        {
          name: "save",
          inputSchema: { properties: { a: {}, b: { type: "string" } }, type: "object" },
          outputSchema: { type: "object" },
        },
        "search(query: string)",
      ],
    });

    await expect(calculateSystemPromptConfigHash(first)).resolves.toBe(
      await calculateSystemPromptConfigHash(reordered),
    );
    await expect(
      calculateSystemPromptConfigHash({ ...reordered, preamble: "Different" }),
    ).resolves.not.toBe(await calculateSystemPromptConfigHash(first));
  });

  it("normalizes common repository origin forms before hashing", async () => {
    await expect(calculateProjectHash("git@github.com:ThesysDev/OpenUI.git")).resolves.toBe(
      await calculateProjectHash("https://github.com/ThesysDev/OpenUI.git"),
    );
    await expect(calculateProjectHash("C:\\work\\openui")).resolves.toBe(
      await calculateProjectHash("C:/work/openui/"),
    );
  });

  it("captures once for concurrent and repeated uses of one configuration", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const spec = makeSpec({
      tools: ["private-tool(query: string)"],
      examples: ["private-example"],
    });

    const expected = generatePrompt(spec);
    expect(generateSystemPrompt(spec)).toBe(expected);
    expect(generateSystemPrompt(spec)).toBe(expected);
    expect(generateSystemPrompt(spec)).toBe(expected);
    await waitForCaptures(fetchMock, 1);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://us.i.posthog.com/capture/");
    const payload = JSON.parse(String(init.body)) as {
      event: string;
      properties: Record<string, unknown>;
    };
    expect(payload.event).toBe("lang_core_system_prompt_generation_used");
    expect(payload.properties).toMatchObject({
      $process_person_profile: false,
      telemetry_schema_version: 1,
      system_prompt_config_hash_version: 1,
      tool_count_bucket: "1-3",
      sdk_name: "@openuidev/lang-core",
      api_surface: "generate_system_prompt",
      input_shape: "legacy_prompt_spec",
      runtime: "node",
      environment: "production",
      telemetry_mode: "server_runtime_prompt_config_first_use",
    });
    expect(Object.keys(payload.properties).sort()).toEqual(
      [
        "$process_person_profile",
        "api_surface",
        "ci",
        "distinct_id",
        "environment",
        "event_id",
        "input_shape",
        "project_hash",
        "project_hash_version",
        "runtime",
        "runtime_version",
        "sdk_name",
        "sdk_version",
        "system_prompt_config_hash",
        "system_prompt_config_hash_version",
        "telemetry_mode",
        "telemetry_schema_version",
        "tool_count_bucket",
      ].sort(),
    );
    expect(String(init.body)).not.toContain("private-library-id");
    expect(String(init.body)).not.toContain("private-tool");
    expect(String(init.body)).not.toContain("private-example");
    expect(String(init.body)).not.toContain("private-component-description");
    expect(payload.properties).not.toHaveProperty("$ip");
  });

  it("classifies the library input and preserves prompt output", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const library = makeSpec();
    const expected = generatePrompt({ ...library, editMode: true });

    expect(
      generateSystemPrompt({ library, promptOptions: { editMode: true } }, { telemetry: true }),
    ).toBe(expected);
    await waitForCaptures(fetchMock, 1);

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const payload = JSON.parse(String(init.body)) as { properties: Record<string, unknown> };
    expect(payload.properties.input_shape).toBe("library_spec");
  });

  it("honors API, environment, and browser opt-outs", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    generateSystemPrompt(makeSpec(), { telemetry: false });
    process.env.DO_NOT_TRACK = "1";
    generateSystemPrompt(makeSpec({ preamble: "dnt" }));
    delete process.env.DO_NOT_TRACK;
    process.env.OPENUI_TELEMETRY_DISABLED = "true";
    generateSystemPrompt(makeSpec({ preamble: "disabled" }));
    delete process.env.OPENUI_TELEMETRY_DISABLED;
    process.env.NODE_ENV = "test";
    generateSystemPrompt(makeSpec({ preamble: "test" }));
    process.env.NODE_ENV = "production";
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", {});
    generateSystemPrompt(makeSpec({ preamble: "browser" }));
    vi.unstubAllGlobals();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("WorkerGlobalScope", {
      prototype: { isPrototypeOf: () => true },
    });
    generateSystemPrompt(makeSpec({ preamble: "browser-worker" }));

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("caps distinct configuration attempts at sixteen per runtime", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    for (let index = 0; index < 20; index += 1) {
      generateSystemPrompt(makeSpec({ preamble: `configuration-${index}` }));
    }

    await waitForCaptures(fetchMock, 16);
  });

  it("never lets a rejected capture affect prompt generation", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("offline");
    });
    vi.stubGlobal("fetch", fetchMock);
    const spec = makeSpec();

    expect(() => generateSystemPrompt(spec)).not.toThrow();
    expect(generateSystemPrompt(spec)).toBe(generatePrompt(spec));
    await waitForCaptures(fetchMock, 1);
    generateSystemPrompt(spec);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not instrument generatePrompt", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    generatePrompt(makeSpec());
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
