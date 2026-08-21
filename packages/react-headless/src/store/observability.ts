import { ObservabilityLevel } from "@openuidev/observability";
import { getResponseErrorMessage } from "../adapters/httpError";

export async function buildObservabilityErrorDetail(response: Response) {
  if (response.ok) return {};
  const res = await response.clone().json();
  return {
    error: res?.error,
    ...(!res.message
      ? await getResponseErrorMessage(response).then((message: string) => ({ message }))
      : { message: res.message }),
  };
}

export function levelForStatus(status: number): ObservabilityLevel {
  return status >= 400 ? "error" : "info";
}
