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
  const byDate = blog.getPages().sort((a, b) => {
    return new Date(b.data.date).getTime() - new Date(a.data.date).getTime();
  });
  // Featured posts lead so their full-width cards sit on top of the grid
  const posts = [
    ...byDate.filter((post) => post.data.featured),
    ...byDate.filter((post) => !post.data.featured),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--blog-surface)] [--blog-surface:#fff] [[data-theme=dark]_&]:[--blog-surface:#171717]">
      <main className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-[960px] px-4 pb-12 pt-16 md:px-8">
          <h1 className="text-4xl font-bold text-[color:var(--openui-text-neutral-primary)]">
            Blog
          </h1>
        </div>

        <section className="bg-[linear-gradient(to_bottom,var(--blog-surface),var(--openui-background)_10rem,var(--openui-background)_calc(100%_-_10rem),var(--blog-surface))]">
          <div className="mx-auto w-full max-w-[960px] px-4 py-24 md:px-8">
            <div className="grid grid-cols-1 gap-5 md:auto-rows-fr md:grid-cols-2">
              {posts.map((post) => (
                <Link
                  key={post.url}
                  href={post.url}
                  className={`group flex min-h-[15rem] flex-col rounded-[var(--openui-radius-4xl)] border border-[var(--openui-border-default)] bg-[var(--openui-foreground)] p-6 no-underline shadow-[var(--openui-shadow-m)] transition-[border-color,box-shadow] hover:border-[var(--openui-border-interactive-emphasis)] hover:shadow-[var(--openui-shadow-l)] ${
                    post.data.featured ? "md:col-span-2" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold leading-snug text-[color:var(--openui-text-neutral-primary)]">
                      {post.data.title}
                    </h2>
                    {post.data.featured && (
                      <span className="inline-flex h-[1.625rem] shrink-0 items-center rounded-lg bg-[color-mix(in_srgb,#7c3aed_14%,transparent)] px-2 text-xs font-semibold uppercase tracking-wide text-[#7c3aed] [[data-theme=dark]_&]:text-[#a78bfa]">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-[color:var(--openui-text-neutral-secondary)]">
                    {post.data.description}
                  </p>
                  <div className="mt-auto flex items-center gap-2 pt-5 text-sm text-[color:var(--openui-text-neutral-secondary)]">
                    <span className="font-medium text-[color:var(--openui-text-neutral-primary)]">
                      {post.data.author}
                    </span>
                    <span aria-hidden="true">·</span>
                    <time>{formatDate(post.data.date)}</time>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
