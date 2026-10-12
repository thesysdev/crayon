import { notFound } from "next/navigation";

// Every Radio URL: / and the other dashboards, /new, and /[threadId]. ../layout.tsx draws them all,
// so the chat stays mounted while the URL moves to a new thread mid-answer. Only one segment is used.
export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  if (((await params).slug?.length ?? 0) > 1) notFound();
  return null;
}
