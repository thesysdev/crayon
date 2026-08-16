import * as bundled from "@openuidev/lang-core";
import { version as workspaceLangCoreVersion } from "../../../../../packages/lang-core/package.json";
import type { LangCoreModule, LoadedLangCore, ParseResult } from "./types";

/** Workspace `@openuidev/lang-core` version — stays in sync with the local package. */
export const BUNDLED_LANG_CORE_VERSION: string = workspaceLangCoreVersion;

// Both webpack and Turbopack rewrite `import(expr)`; magic comments differ
// between them and drift across Next versions. `new Function` is the one
// bundler-proof way to get a native dynamic import.
const dynamicImport = new Function("u", "return import(u)") as (
  u: string,
) => Promise<Record<string, unknown>>;

const CDN_SOURCES = [
  {
    source: "esm.sh" as const,
    url: (v: string) => `https://esm.sh/@openuidev/lang-core@${v}`,
  },
  {
    source: "jsdelivr" as const,
    url: (v: string) => `https://cdn.jsdelivr.net/npm/@openuidev/lang-core@${v}/+esm`,
  },
];

const cache = new Map<string, Promise<LoadedLangCore>>();

function detect(
  mod: LangCoreModule,
  version: string,
  source: LoadedLangCore["source"],
): LoadedLangCore {
  if (typeof mod.createParser !== "function") {
    return {
      version,
      mod,
      source,
      compatible: false,
      reason: "This version does not export createParser().",
      capabilities: { streaming: false, streamSet: false, enrich: false },
    };
  }

  // Smoke test: the ParseResult shape must be recognizable or every panel breaks.
  try {
    const result: ParseResult = mod
      .createParser({ $defs: { Text: { type: "object", properties: {} } } })
      .parse('root = Text("hi")');
    if (
      !result ||
      typeof result !== "object" ||
      !result.meta ||
      !Array.isArray(result.meta.errors)
    ) {
      throw new Error("ParseResult has no meta.errors array");
    }
  } catch (err) {
    return {
      version,
      mod,
      source,
      compatible: false,
      reason: `Smoke test failed: ${err instanceof Error ? err.message : String(err)}`,
      capabilities: { streaming: false, streamSet: false, enrich: false },
    };
  }

  let streamSet = false;
  const streaming = typeof mod.createStreamingParser === "function";
  if (streaming) {
    try {
      const sp = mod.createStreamingParser!({ $defs: {} });
      streamSet = typeof sp.set === "function";
    } catch {
      // constructor threw — treat streaming as unsupported
      return {
        version,
        mod,
        source,
        compatible: true,
        capabilities: {
          streaming: false,
          streamSet: false,
          enrich: typeof mod.enrichErrors === "function",
        },
      };
    }
  }

  return {
    version,
    mod,
    source,
    compatible: true,
    capabilities: { streaming, streamSet, enrich: typeof mod.enrichErrors === "function" },
  };
}

async function loadUncached(version: string): Promise<LoadedLangCore> {
  if (version === BUNDLED_LANG_CORE_VERSION) {
    return detect(bundled as LangCoreModule, version, "bundled");
  }
  for (const cdn of CDN_SOURCES) {
    try {
      const mod = await Promise.race([
        dynamicImport(cdn.url(version)),
        new Promise<never>((_, reject) =>
          // esm.sh can hang while building a never-requested version, not just 404.
          setTimeout(() => reject(new Error("CDN timeout")), 8000),
        ),
      ]);
      return detect(mod as LangCoreModule, version, cdn.source);
    } catch {
      continue;
    }
  }
  // All CDNs unreachable — validate with the bundled parser and say so in the UI.
  return detect(bundled as LangCoreModule, BUNDLED_LANG_CORE_VERSION, "bundled");
}

/**
 * Load a specific published version. Resolved modules (and in-flight loads)
 * are cached per version so switching back is instant.
 */
export function loadLangCore(version: string): Promise<LoadedLangCore> {
  let pending = cache.get(version);
  if (!pending) {
    pending = loadUncached(version);
    cache.set(version, pending);
    // Don't poison the cache with transient failures (e.g. offline).
    pending.catch(() => cache.delete(version));
  }
  return pending;
}
