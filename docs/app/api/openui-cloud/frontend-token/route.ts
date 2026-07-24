import { mintFrontendToken } from "@/lib/openui-cloud/cloud-api";
import { readOpenuiCloudConfig } from "@/lib/openui-cloud/config";
import { unavailableResponse } from "@/lib/openui-cloud/errors";
import { hasAllowedOrigin, hasValidEmptyBody } from "@/lib/openui-cloud/request";
import { readCloudUserId } from "@/lib/openui-cloud/user-id";

export async function POST(request: Request): Promise<Response> {
  const config = readOpenuiCloudConfig();
  if (!config) return unavailableResponse();
  if (!hasAllowedOrigin(request)) return unavailableResponse(403);
  if (!(await hasValidEmptyBody(request))) return unavailableResponse(415);

  const userId = readCloudUserId(request);
  if (!userId) return unavailableResponse(401);

  try {
    const { token, expiresAt } = await mintFrontendToken(config, userId, request.signal);

    return Response.json(
      { token, expires_at: expiresAt },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return unavailableResponse(503);
  }
}
