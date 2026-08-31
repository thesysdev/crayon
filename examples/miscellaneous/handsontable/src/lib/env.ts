export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function envOr(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export const CLOUD_EMBED_URL = "https://api.thesys.dev/v1/embed";
export const CLOUD_API_ORIGIN = "https://api.thesys.dev";
export const DEFAULT_MODEL = "google/gemini-3.6-flash-free";
