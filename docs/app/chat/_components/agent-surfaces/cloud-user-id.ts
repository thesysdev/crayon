import { isCloudUserId } from "@/lib/openui-cloud/user-id";

const CLOUD_USER_ID_STORAGE_KEY = "openui-cloud-user-id";

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
