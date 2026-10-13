/** A content date as YYYY-MM-DD, the one format the sitemap, Open Graph and JSON-LD all use. */
export function toDay(date: string | Date): string {
  return new Date(date).toISOString().slice(0, 10);
}

/**
 * A blog post's dates: `published` from `date`, `updated` from `updatedAt` once the post has been
 * revised, and `modified`, the day its content last changed, for every "last modified" field.
 */
export function postDates(post: { date: string | Date; updatedAt?: string | Date }) {
  const published = toDay(post.date);
  const updated = post.updatedAt === undefined ? undefined : toDay(post.updatedAt);
  return { published, updated, modified: updated ?? published };
}
