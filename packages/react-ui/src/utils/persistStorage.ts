import { createJSONStorage, type StateStorage } from "zustand/middleware";

// localStorage that never throws. When storage is blocked or full, reads act as
// "nothing saved" and writes are dropped, so a preference just isn't kept.
const safeLocalStorage: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // Blocked or over quota.
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      // Blocked.
    }
  },
};

/**
 * JSON storage for zustand `persist`, shared by every saved preference.
 * Undefined (no `persist` API) on the server, or where touching
 * `window.localStorage` itself throws.
 */
export const createPreferenceStorage = () =>
  createJSONStorage(() => {
    void window.localStorage;
    return safeLocalStorage;
  });
