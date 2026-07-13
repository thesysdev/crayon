import { readOpenuiCloudConfig } from "@/lib/openui-cloud/config";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  return Response.json(
    { enabled: readOpenuiCloudConfig() !== null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
