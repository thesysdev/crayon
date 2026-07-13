import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import type { OpenuiCloudConfig } from "./config";

const SESSION_VERSION = "v1";
const SESSION_ID_BYTES = 32;
const PRODUCTION_COOKIE_NAME = "__Host-openui-cloud-session";
const LOCAL_COOKIE_NAME = "openui-cloud-session";

interface VerifiedSession {
  id: string;
  signedWithCurrentSecret: boolean;
}

export interface CloudSessionIdentity {
  userId: string;
  setCookie?: string;
}

export function getExistingCloudSession(
  request: Request,
  config: OpenuiCloudConfig,
): CloudSessionIdentity | null {
  const cookieName = getCookieName(request);
  const value = readCookie(request.headers.get("cookie"), cookieName);
  if (!value) return null;

  const verified = verifySessionToken(value, config);
  if (!verified) return null;

  return {
    userId: deriveCloudUserId(verified.id),
    setCookie: verified.signedWithCurrentSecret
      ? undefined
      : serializeSessionCookie(
          request,
          signSessionToken(verified.id, config.sessionSecrets.current),
        ),
  };
}

export function getOrCreateCloudSession(
  request: Request,
  config: OpenuiCloudConfig,
): CloudSessionIdentity {
  const existing = getExistingCloudSession(request, config);
  if (existing) return existing;

  const sessionId = randomBytes(SESSION_ID_BYTES).toString("base64url");
  const value = signSessionToken(sessionId, config.sessionSecrets.current);

  return {
    userId: deriveCloudUserId(sessionId),
    setCookie: serializeSessionCookie(request, value),
  };
}

function signSessionToken(id: string, secret: string): string {
  const payload = `${SESSION_VERSION}.${id}`;
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifySessionToken(value: string, config: OpenuiCloudConfig): VerifiedSession | null {
  const [version, id, suppliedSignature, extra] = value.split(".");
  if (
    version !== SESSION_VERSION ||
    !id ||
    !/^[A-Za-z0-9_-]{43}$/.test(id) ||
    !suppliedSignature ||
    !/^[A-Za-z0-9_-]{43}$/.test(suppliedSignature) ||
    extra !== undefined
  ) {
    return null;
  }

  const payload = `${version}.${id}`;
  const secrets = [
    { secret: config.sessionSecrets.current, isCurrent: true },
    { secret: config.sessionSecrets.previous, isCurrent: false },
  ].filter((candidate): candidate is { secret: string; isCurrent: boolean } =>
    Boolean(candidate.secret),
  );

  for (const { secret, isCurrent } of secrets) {
    const expected = createHmac("sha256", secret).update(payload).digest();
    let supplied: Buffer;
    try {
      supplied = Buffer.from(suppliedSignature, "base64url");
    } catch {
      continue;
    }
    if (supplied.length === expected.length && timingSafeEqual(supplied, expected)) {
      return { id, signedWithCurrentSecret: isCurrent };
    }
  }

  return null;
}

function deriveCloudUserId(sessionId: string): string {
  const digest = createHmac("sha256", Buffer.from(sessionId, "base64url"))
    .update(`openui-docs-cloud-user:${SESSION_VERSION}`)
    .digest("base64url");
  return `openui_docs_${digest}`;
}

function getCookieName(request: Request): string {
  const url = new URL(request.url);
  const localHttp =
    url.protocol === "http:" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]");
  return localHttp ? LOCAL_COOKIE_NAME : PRODUCTION_COOKIE_NAME;
}

function serializeSessionCookie(request: Request, value: string): string {
  const cookieName = getCookieName(request);
  const secure = cookieName === PRODUCTION_COOKIE_NAME ? "; Secure" : "";
  return `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Lax${secure}`;
}

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;

  for (const pair of header.split(";")) {
    const separator = pair.indexOf("=");
    if (separator === -1) continue;
    if (pair.slice(0, separator).trim() !== name) continue;
    return pair.slice(separator + 1).trim() || null;
  }

  return null;
}
