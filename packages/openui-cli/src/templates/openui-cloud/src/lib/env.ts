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
