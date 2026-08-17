import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateSystemPrompt } from "../../index";
import {
  compileSchema,
  createParser,
  createStreamingParser,
  parse,
  type LibraryJSONSchema,
} from "../index";

const TELEMETRY_STATE_KEY = Symbol.for("@openuidev/lang-core/telemetry/v1");

const schema: LibraryJSONSchema = {
  $defs: {
    Stack: {
      properties: { children: {} },
      required: ["children"],
    },
    PrivateCard: {
      properties: { title: {} },
      required: ["title"],
    },
  },
};

function installCaptureMock() {
  const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function getOnlyCapture(fetchMock: ReturnType<typeof vi.fn>) {
  await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  return JSON.parse(String(init.body)) as {
    event: string;
    properties: Record<string, unknown>;
  };
}

beforeEach(() => {
  Reflect.deleteProperty(globalThis, TELEMETRY_STATE_KEY);
  vi.stubEnv("OPENUI_RUNTIME_TELEMETRY_ENABLED", "1");
  vi.stubEnv("OPENUI_TELEMETRY_DISABLED", "");
  vi.stubEnv("DO_NOT_TRACK", "");
  vi.stubEnv("NODE_ENV", "test");
  vi.spyOn(Math, "random").mockReturnValue(0);

  if (typeof process.getBuiltinModule === "function") {
    vi.spyOn(process, "getBuiltinModule").mockReturnValue(undefined);
  }
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, TELEMETRY_STATE_KEY);
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("createParser().parse() telemetry", () => {
  it("captures one allowlisted event for a valid result", async () => {
    const fetchMock = installCaptureMock();
    const parser = createParser(schema);

    const result = parser.parse('root = PrivateCard("TOP_SECRET_VALUE")');

    expect(result.root?.typeName).toBe("PrivateCard");
    const payload = await getOnlyCapture(fetchMock);
    expect(payload.event).toBe("lang_core_parser_parse_used");
    expect(payload.properties).toMatchObject({
      $process_person_profile: false,
      sdk_name: "@openuidev/lang-core",
      api_surface: "parser.parse",
      runtime: "node",
      environment: "test",
      sample_rate: 0.1,
      outcome: "valid",
      incomplete: false,
      has_renderable_root: true,
      statement_count: 1,
      unresolved_count: 0,
      orphaned_count: 0,
      validation_error_count: 0,
      unknown_component_count: 0,
      missing_required_count: 0,
      null_required_count: 0,
      inline_reserved_count: 0,
      excess_args_count: 0,
    });

    const allowedProperties = new Set([
      "distinct_id",
      "$process_person_profile",
      "event_id",
      "telemetry_schema_version",
      "project_hash_version",
      "project_hash",
      "sdk_name",
      "sdk_version",
      "api_surface",
      "runtime",
      "runtime_version",
      "environment",
      "ci",
      "ci_name",
      "sample_rate",
      "outcome",
      "incomplete",
      "has_renderable_root",
      "statement_count",
      "unresolved_count",
      "orphaned_count",
      "validation_error_count",
      "unknown_component_count",
      "missing_required_count",
      "null_required_count",
      "inline_reserved_count",
      "excess_args_count",
    ]);
    expect(Object.keys(payload.properties).filter((key) => !allowedProperties.has(key))).toEqual(
      [],
    );

    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain("TOP_SECRET_VALUE");
    expect(serialized).not.toContain("PrivateCard");
    expect(serialized).not.toContain("duration_ms");
  });

  it("reports only structural and fixed-code counts for invalid input", async () => {
    const fetchMock = installCaptureMock();
    const parser = createParser(schema);
    const source = [
      'root = Stack([Ghost("SECRET_UNKNOWN"), missing, nullish, Query("SECRET_TOOL", {}), extra, unresolvedSecret])',
      "missing = PrivateCard()",
      "nullish = PrivateCard(null)",
      'extra = PrivateCard("ok", "SECRET_EXTRA")',
      'orphanSecret = PrivateCard("SECRET_ORPHAN")',
    ].join("\n");

    const result = parser.parse(source);

    expect(result.meta.errors.map((error) => error.code).sort()).toEqual([
      "excess-args",
      "inline-reserved",
      "missing-required",
      "null-required",
      "unknown-component",
    ]);
    const payload = await getOnlyCapture(fetchMock);
    expect(payload.properties).toMatchObject({
      outcome: "invalid",
      has_renderable_root: true,
      statement_count: 5,
      unresolved_count: 1,
      orphaned_count: 1,
      validation_error_count: 5,
      unknown_component_count: 1,
      missing_required_count: 1,
      null_required_count: 1,
      inline_reserved_count: 1,
      excess_args_count: 1,
    });

    const serialized = JSON.stringify(payload);
    for (const excluded of [
      "SECRET_UNKNOWN",
      "SECRET_TOOL",
      "SECRET_EXTRA",
      "SECRET_ORPHAN",
      "orphanSecret",
      "unresolvedSecret",
      "Ghost",
      "PrivateCard",
    ]) {
      expect(serialized).not.toContain(excluded);
    }
  });

  it("records no-root and thrown outcomes without exception content", async () => {
    const noRootFetch = installCaptureMock();
    const parser = createParser(schema);

    expect(parser.parse("").root).toBeNull();
    const noRootPayload = await getOnlyCapture(noRootFetch);
    expect(noRootPayload.properties).toMatchObject({
      outcome: "no_renderable_root",
      has_renderable_root: false,
      validation_error_count: 0,
    });

    const thrownFetch = installCaptureMock();
    const originalError = new Error("SECRET_THROWN_ERROR");
    const invalidInput = {
      trim(): never {
        throw originalError;
      },
    } as unknown as string;

    expect(() => parser.parse(invalidInput)).toThrow(originalError);
    const thrownPayload = await getOnlyCapture(thrownFetch);
    expect(thrownPayload.properties.outcome).toBe("threw");
    expect(thrownPayload.properties).not.toHaveProperty("validation_error_count");
    expect(JSON.stringify(thrownPayload)).not.toContain("SECRET_THROWN_ERROR");
  });

  it.each([
    ["missing runtime opt-in", undefined, undefined, undefined],
    ["false runtime opt-in", "0", undefined, undefined],
    ["global telemetry disable", "1", "1", undefined],
    ["do-not-track override", "1", undefined, "1"],
  ])("does not sample or capture with %s", (_label, enabled, disabled, doNotTrack) => {
    const fetchMock = installCaptureMock();
    const randomSpy = vi.mocked(Math.random);
    enabled === undefined
      ? delete process.env.OPENUI_RUNTIME_TELEMETRY_ENABLED
      : (process.env.OPENUI_RUNTIME_TELEMETRY_ENABLED = enabled);
    disabled === undefined
      ? delete process.env.OPENUI_TELEMETRY_DISABLED
      : (process.env.OPENUI_TELEMETRY_DISABLED = disabled);
    doNotTrack === undefined
      ? delete process.env.DO_NOT_TRACK
      : (process.env.DO_NOT_TRACK = doNotTrack);

    const result = createParser(schema).parse('root = PrivateCard("still parses")');

    expect(result.root?.typeName).toBe("PrivateCard");
    expect(randomSpy).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(Reflect.has(globalThis, TELEMETRY_STATE_KEY)).toBe(false);
  });

  it("rejects unsampled calls before telemetry state or network work", () => {
    const fetchMock = installCaptureMock();
    const randomSpy = vi.mocked(Math.random).mockReturnValue(0.1);

    const result = createParser(schema).parse('root = PrivateCard("unsampled")');

    expect(result.root?.typeName).toBe("PrivateCard");
    expect(randomSpy).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(Reflect.has(globalThis, TELEMETRY_STATE_KEY)).toBe(false);
  });

  it.each([
    ["browser page", { window: {}, document: {} }],
    ["React Native", { navigator: { product: "ReactNative" } }],
    ["browser worker", { WorkerGlobalScope: { prototype: Object.prototype } }],
  ])("does not instrument a %s", (_label, globals) => {
    const fetchMock = installCaptureMock();
    const randomSpy = vi.mocked(Math.random);

    for (const [name, value] of Object.entries(globals)) vi.stubGlobal(name, value);

    expect(createParser(schema).parse('root = PrivateCard("client")').root).not.toBeNull();

    expect(randomSpy).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(Reflect.has(globalThis, TELEMETRY_STATE_KEY)).toBe(false);
  });

  it("does not instrument low-level or streaming parser calls", () => {
    const fetchMock = installCaptureMock();
    const randomSpy = vi.mocked(Math.random);

    const paramMap = compileSchema(schema);
    expect(parse('root = PrivateCard("direct")', paramMap).root).not.toBeNull();
    const streaming = createStreamingParser(schema);
    streaming.push('root = PrivateCard("streaming")');
    streaming.set('root = PrivateCard("streaming-set")');
    streaming.getResult();

    expect(randomSpy).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(Reflect.has(globalThis, TELEMETRY_STATE_KEY)).toBe(false);
  });

  it("keeps parse results unchanged when capture rejects", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("network unavailable");
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = createParser(schema).parse('root = PrivateCard("available")');

    expect(result.root?.props.title).toBe("available");
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it("preserves the existing system-prompt event contract", async () => {
    const fetchMock = installCaptureMock();

    const prompt = generateSystemPrompt({
      components: {
        PrivateCard: { signature: "PrivateCard(title: string)" },
      },
    });

    expect(prompt).toContain("PrivateCard(title: string)");
    const payload = await getOnlyCapture(fetchMock);
    expect(payload.event).toBe("lang_core_system_prompt_generation_used");
    expect(payload.properties).toMatchObject({
      api_surface: "generate_system_prompt",
      input_shape: "legacy_prompt_spec",
      sample_rate: 0.1,
    });
  });
});
