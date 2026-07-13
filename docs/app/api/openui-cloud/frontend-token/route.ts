import { mintFrontendToken } from "@/lib/openui-cloud/cloud-api";
import { readOpenuiCloudConfig } from "@/lib/openui-cloud/config";
import { unavailableResponse } from "@/lib/openui-cloud/errors";
import { hasAllowedOrigin, hasValidEmptyBody } from "@/lib/openui-cloud/request";
import { getOrCreateCloudSession } from "@/lib/openui-cloud/session";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const config = readOpenuiCloudConfig();
  if (!config) return unavailableResponse();
  if (!hasAllowedOrigin(request)) return unavailableResponse(403);
  if (!(await hasValidEmptyBody(request))) return unavailableResponse(415);

  const session = getOrCreateCloudSession(request, config);

  try {
    const { token, expiresAt } = await mintFrontendToken(config, session.userId, request.signal);
    const headers = new Headers({
      "Cache-Control": "no-store",
      Vary: "Cookie",
    });
    if (session.setCookie) headers.set("Set-Cookie", session.setCookie);

    return Response.json({ token, expires_at: expiresAt }, { headers });
  } catch {
    return unavailableResponse(503, { Vary: "Cookie" });
  }
}
