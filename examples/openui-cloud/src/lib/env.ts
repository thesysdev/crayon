// Env reads happen at REQUEST time (inside handlers), never at module scope:
// tests can vi.stubEnv per-case and `next build` doesn't bake values in.

export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function envOr(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

/**
 * OpenUI Cloud API origin (master-key plane: /v1/embed/responses, /v1/frontend-tokens).
 * Read at request time (per this file's convention) and env-driven so a local stack can be
 * targeted via `OPENUI_CLOUD_BASE_URL`; defaults to production.
 */
export function openuiCloudBaseUrl(): string {
  return envOr("OPENUI_CLOUD_BASE_URL", "https://api.thesys.dev");
}
