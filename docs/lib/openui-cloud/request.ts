const DEFAULT_MAX_BODY_BYTES = 256 * 1024;

export class InvalidCloudRequestError extends Error {
  constructor() {
    super("Invalid OpenUI Cloud request");
    this.name = "InvalidCloudRequestError";
  }
}

export function hasAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return false;

  let normalizedOrigin: string;
  try {
    normalizedOrigin = new URL(origin).origin;
  } catch {
    return false;
  }

  if (normalizedOrigin !== origin) return false;

  const allowedOrigins = new Set([new URL(request.url).origin]);
  for (const configuredOrigin of (process.env.OPENUI_CLOUD_ALLOWED_ORIGINS ?? "").split(",")) {
    const candidate = configuredOrigin.trim();
    if (!candidate) continue;
    try {
      allowedOrigins.add(new URL(candidate).origin);
    } catch {
      // A malformed allowlist entry is ignored rather than broadening access.
    }
  }

  return allowedOrigins.has(normalizedOrigin);
}

export function hasJsonContentType(request: Request): boolean {
  const contentType = request.headers.get("content-type");
  if (!contentType) return false;
  return contentType.split(";", 1)[0]?.trim().toLowerCase() === "application/json";
}

/** The frontend-token endpoint is bodyless in the maintained Cloud client. */
export async function hasValidEmptyBody(request: Request): Promise<boolean> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && contentLength !== "0") return false;

  const contentType = request.headers.get("content-type");
  if (contentType !== null && !hasJsonContentType(request)) return false;
  if (request.body === null) return true;

  // Next's Node adapter exposes an empty stream for bodyless non-GET/HEAD requests.
  const reader = request.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return true;
      if (value.byteLength === 0) continue;

      await reader.cancel().catch(() => undefined);
      return false;
    }
  } catch {
    return false;
  } finally {
    reader.releaseLock();
  }
}

export async function readLimitedJson(
  request: Request,
  maxBytes = DEFAULT_MAX_BODY_BYTES,
): Promise<unknown> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null) {
    const length = Number(declaredLength);
    if (!Number.isSafeInteger(length) || length < 0 || length > maxBytes) {
      throw new InvalidCloudRequestError();
    }
  }

  if (!request.body) throw new InvalidCloudRequestError();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw new InvalidCloudRequestError();
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof InvalidCloudRequestError) throw error;
    throw new InvalidCloudRequestError();
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return JSON.parse(text) as unknown;
  } catch {
    throw new InvalidCloudRequestError();
  }
}
