import { blog } from "@/lib/source";
import Link from "next/link";
import { Footer } from "../(home)/sections/Footer/Footer";

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BlogIndex() {
  const posts = blog.getPages().sort((a, b) => {
    return new Date(b.data.date).getTime() - new Date(a.data.date).getTime();
  });

  return (
    <div className="flex min-h-screen flex-col bg-white [[data-theme=dark]_&]:bg-[#171717]">
      <main className="mx-auto w-full max-w-[800px] flex-1 px-4 py-16 md:px-8">
        <h1 className="mb-12 text-4xl font-bold text-neutral-900 [[data-theme=dark]_&]:text-white">
          Blog
        </h1>
        <div className="flex flex-col gap-5">
          {posts.map((post) => (
            <Link
              key={post.url}
              href={post.url}
              className="group flex flex-col gap-3 rounded-2xl border border-black/[0.07] bg-white p-6 no-underline shadow-sm transition-colors hover:border-black/[0.16] [[data-theme=dark]_&]:border-white/10 [[data-theme=dark]_&]:bg-white/[0.04] [[data-theme=dark]_&]:shadow-none [[data-theme=dark]_&]:hover:border-white/25 [[data-theme=dark]_&]:hover:bg-white/[0.07]"
            >
              <h2 className="text-lg font-semibold text-neutral-900 [[data-theme=dark]_&]:text-white">
                {post.data.title}
              </h2>
              <p className="text-sm leading-relaxed text-black/55 [[data-theme=dark]_&]:text-white/60">
                {post.data.description}
              </p>
              <div className="mt-1 flex items-center gap-2 text-sm text-black/45 [[data-theme=dark]_&]:text-white/50">
                <span className="font-medium text-black/70 [[data-theme=dark]_&]:text-white/70">
                  {post.data.author}
                </span>
                <span aria-hidden="true">·</span>
                <time>{formatDate(post.data.date)}</time>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
