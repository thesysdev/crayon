const THESYS_HOST = "thesys.dev";

const UTM_PARAMS = {
  utm_source: "openui",
  utm_medium: "referral",
  utm_campaign: "openui_to_thesys",
} as const;

export const POSTHOG_DISTINCT_ID_PARAM = "posthog_distinct_id";
export const POSTHOG_SESSION_ID_PARAM = "posthog_session_id";

function isThesysHost(hostname: string) {
  return hostname === THESYS_HOST || hostname.endsWith(`.${THESYS_HOST}`);
}

export function addThesysLinkAttribution(
  href: string,
  baseUrl: string,
  posthogDistinctId: string | undefined,
  posthogSessionId: string | undefined,
) {
  let url: URL;

  try {
    url = new URL(href, baseUrl);
  } catch {
    return href;
  }

  if (!isThesysHost(url.hostname)) return href;

  for (const [key, value] of Object.entries(UTM_PARAMS)) {
    if (!url.searchParams.has(key)) url.searchParams.set(key, value);
  }

  if (posthogDistinctId) {
    url.searchParams.set(POSTHOG_DISTINCT_ID_PARAM, posthogDistinctId);
  }

  if (posthogSessionId) {
    url.searchParams.set(POSTHOG_SESSION_ID_PARAM, posthogSessionId);
  }

  return url.toString();
}
