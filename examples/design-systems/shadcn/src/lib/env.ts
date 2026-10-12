export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const THESYS_API_URL = "https://api.thesys.dev";
export const DEFAULT_MODEL = "google/gemini-3.6-flash-free";
