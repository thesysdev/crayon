/**
 * Renders a JSON-LD structured-data block. Server-rendered so crawlers see it
 * in the initial HTML. Pass any schema.org object (or array) as `data`.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD must be inlined as raw text in the document head/body
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
