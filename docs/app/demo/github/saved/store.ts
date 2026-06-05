export interface SavedDashboard {
  id: string;
  username: string;
  title: string;
  code: string;
  created_at: string;
}

const STORAGE_KEY = "openui-gh-saved-dashboards";

export function getSavedDashboards(): SavedDashboard[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function upsertDashboard(input: {
  id?: string | null;
  username: string;
  title: string;
  code: string;
}): SavedDashboard {
  const dashboards = getSavedDashboards();

  // Iterate on an existing dashboard: update its code in place, keep position.
  if (input.id) {
    const idx = dashboards.findIndex((d) => d.id === input.id);
    if (idx >= 0) {
      dashboards[idx] = { ...dashboards[idx], code: input.code };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboards));
      return dashboards[idx];
    }
  }

  const dashboard: SavedDashboard = {
    id: crypto.randomUUID(),
    username: input.username,
    title: input.title,
    code: input.code,
    created_at: new Date().toISOString(),
  };
  dashboards.unshift(dashboard);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboards));
  return dashboard;
}

export function deleteSavedDashboard(id: string): SavedDashboard[] {
  const filtered = getSavedDashboards().filter((d) => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
}
