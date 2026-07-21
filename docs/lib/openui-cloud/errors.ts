export const OPENUI_CLOUD_UNAVAILABLE_MESSAGE = "OpenUI Cloud is unavailable.";

export function unavailableResponse(status = 503, headers?: HeadersInit): Response {
  return Response.json(
    { error: { message: OPENUI_CLOUD_UNAVAILABLE_MESSAGE } },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        ...headers,
      },
    },
  );
}
