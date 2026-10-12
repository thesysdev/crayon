export const runtime = "nodejs";

// Finds one photo for a moodboard image. Named places and dishes ("Fushimi Inari-taisha",
// "Kaiseki") come from their Wikipedia article's lead image, then a Wikipedia or Wikimedia
// Commons search, which need no key and show the actual landmark or dish. Atmosphere shots
// ("rainy alley lanterns") use Unsplash or Pexels when UNSPLASH_ACCESS_KEY or PEXELS_API_KEY is
// set. Openverse, also keyless, is the last fallback. Results are cached for the server's life.

type Photo = { url: string; title: string; creator?: string; license: string; landing: string };
type Provider = (query: string) => Promise<Photo | null>;

const USER_AGENT =
  "openui-booking-assistant-moodboard/0.1 (local dev; https://github.com/thesysdev/openui)";
const cache = new Map<string, Photo>();

async function getJson<T>(url: URL | string, headers: Record<string, string> = {}) {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, ...headers },
    signal: AbortSignal.timeout(8_000),
  }).catch(() => null);
  return response?.ok ? ((await response.json()) as T) : null;
}

// Photos only: skip SVG maps, logos, and diagrams.
const isPhoto = (url?: string) => !!url && /\.(jpe?g|webp)(\/|\?|$)/i.test(new URL(url).pathname);
const strip = (html?: string) => html?.replace(/<[^>]+>/g, "").trim() || undefined;

type WikiPage = {
  title: string;
  index?: number;
  fullurl?: string;
  thumbnail?: { source: string };
};

function wikipedia(mode: "title" | "search"): Provider {
  return async (query) => {
    const url = new URL("https://en.wikipedia.org/w/api.php");
    const params: Record<string, string> = {
      action: "query",
      format: "json",
      formatversion: "2",
      prop: "pageimages|info",
      inprop: "url",
      piprop: "thumbnail",
      pithumbsize: "1280",
      redirects: "1",
    };
    if (mode === "title") params.titles = query;
    else Object.assign(params, { generator: "search", gsrsearch: query, gsrlimit: "5" });
    url.search = new URLSearchParams(params).toString();
    const result = await getJson<{ query?: { pages?: WikiPage[] } }>(url);
    const page = (result?.query?.pages ?? [])
      .filter((candidate) => isPhoto(candidate.thumbnail?.source))
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))[0];
    if (!page?.thumbnail) return null;
    return {
      url: page.thumbnail.source,
      title: page.title,
      creator: "Wikipedia",
      license: "Wikimedia Commons",
      landing: page.fullurl ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
    };
  };
}

type CommonsPage = {
  title: string;
  index?: number;
  imageinfo?: {
    thumburl?: string;
    descriptionurl?: string;
    extmetadata?: { Artist?: { value: string }; LicenseShortName?: { value: string } };
  }[];
};

const commons: Provider = async (query) => {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.search = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "search",
    gsrnamespace: "6",
    gsrsearch: `${query} filetype:bitmap`,
    gsrlimit: "6",
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "1280",
    iiextmetadatafilter: "Artist|LicenseShortName",
  }).toString();
  const result = await getJson<{ query?: { pages?: CommonsPage[] } }>(url);
  const page = (result?.query?.pages ?? [])
    .filter((candidate) => isPhoto(candidate.imageinfo?.[0]?.thumburl))
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))[0];
  const info = page?.imageinfo?.[0];
  if (!page || !info?.thumburl) return null;
  return {
    url: info.thumburl,
    title: page.title.replace(/^File:/, "").replace(/\.\w+$/, ""),
    creator: strip(info.extmetadata?.Artist?.value),
    license: info.extmetadata?.LicenseShortName?.value ?? "Wikimedia Commons",
    landing: info.descriptionurl ?? "https://commons.wikimedia.org",
  };
};

const unsplash: Provider = async (query) => {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;
  const url = new URL("https://api.unsplash.com/search/photos");
  url.search = new URLSearchParams({ query, per_page: "1", orientation: "landscape" }).toString();
  type Result = {
    results?: {
      alt_description?: string;
      urls: { regular: string };
      user: { name: string };
      links: { html: string };
    }[];
  };
  const photo = (await getJson<Result>(url, { Authorization: `Client-ID ${key}` }))?.results?.[0];
  return photo
    ? {
        url: photo.urls.regular,
        title: photo.alt_description ?? query,
        creator: photo.user.name,
        license: "Unsplash",
        landing: photo.links.html,
      }
    : null;
};

const pexels: Provider = async (query) => {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  const url = new URL("https://api.pexels.com/v1/search");
  url.search = new URLSearchParams({ query, per_page: "1" }).toString();
  type Result = {
    photos?: { alt?: string; src: { large2x: string }; photographer: string; url: string }[];
  };
  const photo = (await getJson<Result>(url, { Authorization: key }))?.photos?.[0];
  return photo
    ? {
        url: photo.src.large2x,
        title: photo.alt || query,
        creator: photo.photographer,
        license: "Pexels",
        landing: photo.url,
      }
    : null;
};

type OpenverseImage = {
  url: string;
  title?: string;
  creator?: string;
  license: string;
  license_version?: string;
  foreign_landing_url: string;
  tags?: { name: string }[];
};

// Openverse's ranking is loose, so prefer the photo whose title and tags mention the most words.
const openverse: Provider = async (query) => {
  const url = new URL("https://api.openverse.org/v1/images/");
  url.search = new URLSearchParams({ q: query, page_size: "20", mature: "false" }).toString();
  const results = (await getJson<{ results?: OpenverseImage[] }>(url))?.results ?? [];
  const words = query.toLowerCase().split(/\s+/);
  const score = (image: OpenverseImage) => {
    const text =
      `${image.title ?? ""} ${image.tags?.map((tag) => tag.name).join(" ") ?? ""}`.toLowerCase();
    return words.filter((word) => text.includes(word)).length;
  };
  const pick = results.toSorted((a, b) => score(b) - score(a))[0];
  return pick
    ? {
        url: pick.url,
        title: pick.title ?? query,
        creator: pick.creator,
        license: `CC ${pick.license.toUpperCase()} ${pick.license_version ?? ""}`.trim(),
        landing: pick.foreign_landing_url,
      }
    : null;
};

const providers: Record<string, Provider[]> = {
  // A named place, dish, or stay: its encyclopedia photo is the most accurate.
  named: [wikipedia("title"), wikipedia("search"), commons, unsplash, pexels, openverse],
  // An atmosphere shot: stock photography reads best, then Commons and Openverse.
  scene: [unsplash, pexels, commons, openverse, wikipedia("search")],
};

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim().slice(0, 120);
  if (!query) return Response.json({ error: "Send q." }, { status: 400 });
  const kind = params.get("kind") === "scene" ? "scene" : "named";
  const key = `${kind}:${query.toLowerCase()}`;

  if (!cache.has(key)) {
    let photo: Photo | null = null;
    for (const provider of providers[kind]) {
      photo = await provider(query).catch(() => null);
      if (photo) break;
    }
    // Remember finds; a miss may be a timeout, so it's tried again next time.
    if (photo) cache.set(key, photo);
  }
  const photo = cache.get(key);
  return photo ? Response.json(photo) : Response.json(null, { status: 404 });
}
