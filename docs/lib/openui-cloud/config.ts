const CLOUD_API_ORIGIN = "https://api.thesys.dev";
const MINIMUM_SECRET_BYTES = 32;

export interface OpenuiCloudConfig {
  apiKey: string;
  apiOrigin: string;
  sessionSecrets: {
    current: string;
    previous?: string;
  };
}

/**
 * Read Cloud configuration at request time so builds and OSS-only deployments do
 * not require Cloud secrets. A malformed optional rotation key fails closed too.
 */
export function readOpenuiCloudConfig(): OpenuiCloudConfig | null {
  if (process.env.OPENUI_CLOUD_DEMO_ENABLED !== "true") return null;

  const apiKey = process.env.THESYS_API_KEY?.trim();
  const current = (
    process.env.OPENUI_CLOUD_SESSION_SECRET_CURRENT ?? process.env.OPENUI_CLOUD_SESSION_SECRET
  )?.trim();
  const previous = process.env.OPENUI_CLOUD_SESSION_SECRET_PREVIOUS?.trim();

  if (!apiKey || !isStrongEnoughSecret(current)) return null;
  if (previous !== undefined && (!isStrongEnoughSecret(previous) || previous === current)) {
    return null;
  }

  return {
    apiKey,
    apiOrigin: CLOUD_API_ORIGIN,
    sessionSecrets: {
      current,
      ...(previous ? { previous } : {}),
    },
  };
}

function isStrongEnoughSecret(secret: string | undefined): secret is string {
  return Boolean(secret && Buffer.byteLength(secret, "utf8") >= MINIMUM_SECRET_BYTES);
}
