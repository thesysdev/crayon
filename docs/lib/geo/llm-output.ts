export const LLM_TEXT_CONTENT_TYPE = "text/plain; charset=utf-8";
export const LLM_MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8";
export const LLM_AGGREGATE_RESPONSE_HEADERS = {
  "Content-Type": LLM_TEXT_CONTENT_TYPE,
  "X-Robots-Tag": "noindex, follow",
} as const;

export type LlmIndexPage = Readonly<{
  title: string;
  description?: string;
  canonicalUrl: string;
  markdownUrl: string;
}>;

type CreateLlmsIndexOptions = Readonly<{
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  repositoryUrl: string;
  fullDocumentationUrl: string;
  pages: readonly LlmIndexPage[];
}>;

type CreateLlmPageDocumentOptions = Readonly<{
  title: string;
  description?: string;
  canonicalUrl: string;
  body: string;
}>;

function normalizeInlineText(value: string, field: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (!normalized) {
    throw new Error(`${field} must not be empty`);
  }

  return normalized;
}

function escapeMarkdownText(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("[", "\\[")
    .replaceAll("]", "\\]")
    .replaceAll("<", "\\<")
    .replaceAll(">", "\\>");
}

function getPageDescription(title: string, description?: string): string {
  const normalizedDescription = description?.replace(/\s+/g, " ").trim();

  return normalizedDescription || `OpenUI documentation for ${title}.`;
}

function parseHttpsUrl(value: string, field: string): URL {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${field} must be an absolute URL`);
  }

  if (url.protocol !== "https:") {
    throw new Error(`${field} must use HTTPS`);
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error(`${field} must not contain credentials, a query, or a fragment`);
  }

  return url;
}

function parseSameOriginUrl(value: string, siteOrigin: string, field: string): URL {
  const url = parseHttpsUrl(value, field);

  if (url.origin !== siteOrigin) {
    throw new Error(`${field} must use the canonical site origin`);
  }

  return url;
}

export function createLlmsIndex({
  siteName,
  siteDescription,
  siteUrl,
  repositoryUrl,
  fullDocumentationUrl,
  pages,
}: CreateLlmsIndexOptions): string {
  const canonicalSiteUrl = parseHttpsUrl(siteUrl, "siteUrl");
  const canonicalRepositoryUrl = parseHttpsUrl(repositoryUrl, "repositoryUrl");
  const canonicalFullDocumentationUrl = parseSameOriginUrl(
    fullDocumentationUrl,
    canonicalSiteUrl.origin,
    "fullDocumentationUrl",
  );
  const seenCanonicalUrls = new Set<string>();
  const seenMarkdownUrls = new Set<string>();

  const pageLines = pages.map((page) => {
    const canonicalUrl = parseSameOriginUrl(
      page.canonicalUrl,
      canonicalSiteUrl.origin,
      "page.canonicalUrl",
    ).toString();
    const markdownUrl = parseSameOriginUrl(
      page.markdownUrl,
      canonicalSiteUrl.origin,
      "page.markdownUrl",
    ).toString();

    if (seenCanonicalUrls.has(canonicalUrl)) {
      throw new Error(`Duplicate canonical URL: ${canonicalUrl}`);
    }
    if (seenMarkdownUrls.has(markdownUrl)) {
      throw new Error(`Duplicate Markdown URL: ${markdownUrl}`);
    }

    seenCanonicalUrls.add(canonicalUrl);
    seenMarkdownUrls.add(markdownUrl);

    const normalizedTitle = normalizeInlineText(page.title, "page.title");
    const title = escapeMarkdownText(normalizedTitle);
    const description = getPageDescription(normalizedTitle, page.description);

    return `- [${title}](${markdownUrl}): ${description} Canonical source: ${canonicalUrl}`;
  });

  return [
    `# ${escapeMarkdownText(normalizeInlineText(siteName, "siteName"))}`,
    "",
    `> ${normalizeInlineText(siteDescription, "siteDescription")}`,
    "",
    "## Project",
    "",
    `- [OpenUI website](${canonicalSiteUrl.toString()}): Canonical OpenUI website.`,
    `- [OpenUI source repository](${canonicalRepositoryUrl.toString()}): Source code and releases.`,
    "",
    "## Documentation",
    "",
    ...pageLines,
    "",
    "## Optional",
    "",
    `- [Complete OpenUI documentation](${canonicalFullDocumentationUrl.toString()}): Full documentation in one plain-text response; it may exceed an LLM context window.`,
    "",
  ].join("\n");
}

export function createLlmPageDocument({
  title,
  description,
  canonicalUrl,
  body,
}: CreateLlmPageDocumentOptions): string {
  const sourceUrl = parseHttpsUrl(canonicalUrl, "canonicalUrl").toString();
  const normalizedBody = body.trim();
  const normalizedTitle = normalizeInlineText(title, "title");

  if (!normalizedBody) {
    throw new Error("body must not be empty");
  }

  return [
    `# ${escapeMarkdownText(normalizedTitle)}`,
    "",
    `> ${getPageDescription(normalizedTitle, description)}`,
    "",
    `Source: ${sourceUrl}`,
    "",
    normalizedBody,
    "",
  ].join("\n");
}

export function createCanonicalLlmDocumentHeaders(canonicalUrl: string) {
  const sourceUrl = parseHttpsUrl(canonicalUrl, "canonicalUrl").toString();

  return {
    "Content-Type": LLM_MARKDOWN_CONTENT_TYPE,
    Link: `<${sourceUrl}>; rel="canonical"`,
  } as const;
}
