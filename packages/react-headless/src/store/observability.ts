import { ObservabilityLevel } from "@openuidev/observability";
import { getResponseErrorMessage } from "../adapters/httpError";

export async function buildObservabilityErrorDetail(response: Response) {
  if (response.ok) return {};

  try {
    const res = await response.clone().json();
    return {
      error: res?.error,
      ...(!res?.message
        ? { message: await getResponseErrorMessage(response) }
        : { message: res.message }),
    };
  } catch {
    return { message: await getResponseErrorMessage(response) };
  }
}

export function levelForStatus(status: number): ObservabilityLevel {
  return status >= 400 ? "error" : "info";
}
