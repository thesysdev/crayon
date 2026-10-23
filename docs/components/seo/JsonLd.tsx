/**
 * Renders a JSON-LD structured-data block, server-rendered so crawlers see it in the initial HTML.
 * `<` is escaped so text inside the data can't close the script tag.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replaceAll("<", "\\u003c") }}
    />
  );
}
