/**
 * Extraction of link "sources" from tool RESULT text, powering the
 * favicon + title rows on tool cards.
 */

export interface ToolResultSource {
  title: string;
  url: string;
  /** Domain used for the favicon lookup (e.g. `en.wikipedia.org`). */
  host: string;
  /** Human-ish site name derived from the host (e.g. `Wikipedia`). */
  siteName: string;
}

interface SourceExtractor {
  /** Which tools this extractor understands (e.g. name suffix or exact match). */
  matches: (toolName: string) => boolean;
  extract: (result: string) => ToolResultSource[];
}

const stripWww = (host: string) => host.replace(/^www\./, "");

// Registrable-name heuristic: drop the TLD and
// any subdomains, capitalize what remains
const TWO_PART_TLD = /\.(co|com|org|net|gov|ac|edu)\.[a-z]{2}$/;

function siteNameFromHost(host: string): string {
  const base = TWO_PART_TLD.test(host)
    ? host.replace(TWO_PART_TLD, "")
    : host.replace(/\.[a-z]+$/i, "");
  const label = base.split(".").pop() || host;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// ── Format: numbered link list ───────────────────────────────────────────────
// `[n] Title` followed by a URL line, optionally a `Source:` domain line:
//   web:   `[n] Title\nURL: <page url>`
//   image: `[n] Title\nImage URL: <image file>\nSource: <page domain>`
const NUMBERED_LINKS = /^\[\d+\]\s*([^\n]*)\n(?:\w+ )?URL:\s*(\S+)(?:\nSource:\s*(\S+))?/gm;

// Readable stand-in when a result entry has no title line: the URL's last
// path segment ("/guides/what-is-thesys-c1" → "What is thesys c1"), else the
// site name. Fetching the real <title> client-side is CORS-blocked.
function titleFromUrl(parsed: URL, host: string): string {
  const slug = parsed.pathname.split("/").filter(Boolean).pop();
  const words = slug
    ? decodeURIComponent(slug)
        .replace(/\.[a-z0-9]+$/i, "") // file extensions
        .replace(/[-_+]+/g, " ")
        .trim()
    : "";
  if (!words) return siteNameFromHost(host);
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function extractNumberedLinks(result: string): ToolResultSource[] {
  const sources: ToolResultSource[] = [];
  for (const match of result.matchAll(NUMBERED_LINKS)) {
    const url = match[2]!;
    try {
      const parsed = new URL(url);
      const host = stripWww(match[3] ?? parsed.hostname);
      sources.push({
        title: match[1]!.trim() || titleFromUrl(parsed, host),
        url,
        host,
        siteName: siteNameFromHost(host),
      });
    } catch {
      // Not a valid absolute URL — skip the row, keep the rest.
    }
  }
  return sources;
}

// ── Registry ─────────────────────────────────────────────────────────────────

const EXTRACTORS: SourceExtractor[] = [
  { matches: (toolName) => /_search$/.test(toolName), extract: extractNumberedLinks },
];

/**
 * Link sources of a tool result, deduped by URL. `[]` when no extractor
 * claims the tool or nothing in the result parses.
 */
export function extractToolSources(toolName: string, result: string): ToolResultSource[] {
  const extractor = EXTRACTORS.find((e) => e.matches(toolName));
  if (!extractor) return [];
  const seen = new Set<string>();
  return extractor.extract(result).filter((source) => {
    if (seen.has(source.url)) return false;
    seen.add(source.url);
    return true;
  });
}
