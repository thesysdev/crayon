const CLOUD_API_ORIGIN = "https://api.thesys.dev";

export interface OpenuiCloudConfig {
  apiKey: string;
  apiOrigin: string;
}

/** Read Cloud configuration at request time so OSS-only builds do not require Cloud secrets. */
export function readOpenuiCloudConfig(): OpenuiCloudConfig | null {
  if (process.env.OPENUI_CLOUD_DEMO_ENABLED !== "true") return null;

  const apiKey = process.env.THESYS_API_KEY?.trim();
  if (!apiKey) return null;

  return {
    apiKey,
    apiOrigin: CLOUD_API_ORIGIN,
  };
}
