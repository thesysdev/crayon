export const runtime = "nodejs";

// Place suggestions for the "Where?" question: Wikipedia's title search, which needs no key and
// returns a one-line description and a thumbnail for each match.
const USER_AGENT =
  "openui-booking-assistant-moodboard/0.1 (local dev; https://github.com/thesysdev/openui)";

type Page = { title: string; description?: string; thumbnail?: { url: string } };

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80);
  if (!q || q.length < 2) return Response.json({ places: [] });
  const url = new URL("https://en.wikipedia.org/w/rest.php/v1/search/title");
  url.search = new URLSearchParams({ q, limit: "6" }).toString();
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(6_000),
  }).catch(() => null);
  const pages = response?.ok ? ((await response.json()) as { pages?: Page[] }).pages : [];
  return Response.json({
    places: (pages ?? []).map((page) => ({
      label: page.title,
      detail: page.description,
      thumbnail: page.thumbnail?.url ? `https:${page.thumbnail.url.replace(/^https?:/, "")}` : null,
    })),
  });
}
