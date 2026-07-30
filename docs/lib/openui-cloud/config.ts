const CLOUD_API_ORIGIN = "https://api.thesys.dev";

export type DocsDemoWorkload =
  | "chat-oss"
  | "chat-cloud"
  | "compare-markdown"
  | "compare-oss"
  | "compare-cloud"
  | "playground"
  | "github";

const DEMO_API_KEY_ENV = {
  "chat-oss": "THESYS_API_KEY_DOCS_CHAT_OSS",
  "chat-cloud": "THESYS_API_KEY_DOCS_CHAT_CLOUD",
  "compare-markdown": "THESYS_API_KEY_DOCS_COMPARE_MARKDOWN",
  "compare-oss": "THESYS_API_KEY_DOCS_COMPARE_OSS",
  "compare-cloud": "THESYS_API_KEY_DOCS_COMPARE_CLOUD",
  playground: "THESYS_API_KEY_DOCS_PLAYGROUND",
  github: "THESYS_API_KEY_DOCS_GITHUB",
} as const satisfies Record<DocsDemoWorkload, string>;

export interface OpenuiCloudConfig {
  apiKey: string;
  apiOrigin: string;
  embedBaseUrl: string;
}

/**
 * Read a hosted demo's Cloud configuration at request time.
 *
 * Each workload has a dedicated key so Cloud usage can be attributed without
 * trusting a browser-provided key selector.
 */
export function readOpenuiCloudConfig(demo: DocsDemoWorkload): OpenuiCloudConfig | null {
  const apiKey = process.env[DEMO_API_KEY_ENV[demo]]?.trim();
  if (!apiKey) return null;

  return {
    apiKey,
    apiOrigin: CLOUD_API_ORIGIN,
    embedBaseUrl: `${CLOUD_API_ORIGIN}/v1/embed`,
  };
}
