export const CLOUD_USER_ID_HEADER = "x-openui-cloud-user-id";

const CLOUD_USER_ID_STORAGE_KEY = "openui-cloud-user-id";
const CLOUD_USER_ID_PATTERN =
  /^openui_docs_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function isCloudUserId(value: string | null): value is string {
  return value !== null && CLOUD_USER_ID_PATTERN.test(value);
}

/** Read the anonymous Cloud user ID generated and retained by the browser session. */
export function readCloudUserId(request: Request): string | null {
  const userId = request.headers.get(CLOUD_USER_ID_HEADER);
  return isCloudUserId(userId) ? userId : null;
}

/** Return the anonymous Cloud user ID retained for this browser session. */
export function getOrCreateCloudUserId(): string {
  const storedUserId = readStoredUserId();
  if (isCloudUserId(storedUserId)) return storedUserId;

  const userId = `openui_docs_${crypto.randomUUID()}`;
  storeUserId(userId);
  return userId;
}

function readStoredUserId(): string | null {
  try {
    return sessionStorage.getItem(CLOUD_USER_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeUserId(userId: string): void {
  try {
    sessionStorage.setItem(CLOUD_USER_ID_STORAGE_KEY, userId);
  } catch {
    // Continue with the generated ID when browser storage is unavailable.
  }
}
