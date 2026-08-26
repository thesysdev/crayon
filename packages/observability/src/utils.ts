import { ObservabilityErrorInfo } from "./types";

/** Normalize any thrown value into the fixed error shape, for placing on `detail`. */
export function toErrorInfo(value: unknown): ObservabilityErrorInfo {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack, cause: value };
  }
  let message: string;
  if (typeof value === "string") {
    message = value;
  } else {
    try {
      message = JSON.stringify(value) ?? String(value);
    } catch {
      message = String(value);
    }
  }
  return { message, cause: value };
}
