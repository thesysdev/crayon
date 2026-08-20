import { GitHubButton } from "@/app/(home)/components/GitHubButton/GitHubButton";
import { Footer } from "@/app/(home)/sections/Footer/Footer";
import type { Metadata } from "next";
import { PillLink } from "../../components/Button/Button";

export const metadata: Metadata = {
  title: "Benchmark methodology | OpenUI",
  description:
    "How the OpenUI generative UI benchmark is run and scored: the models, the component catalog, each SDK's own prompts and parsers, and the two rubrics.",
};

const SECTIONS = [
  { id: "how-we-ran-it", label: "How we ran it" },
  { id: "rubrics", label: "Rubrics" },
];

/* Same layout as a blog post (app/blog/[slug]/page.tsx) — gradient band, TOC
   rail, prose column, footer — with the post's Methodology section as the
   body. The text is the blog's, not a second version of it. */
export default function BenchmarkMethodologyPage() {
  return (
    <>
      <div className="min-h-screen bg-[linear-gradient(to_bottom,var(--openui-foreground),var(--openui-background)_10rem,var(--openui-background)_calc(100%_-_10rem),var(--openui-foreground))] [[data-theme=dark]_&]:bg-[linear-gradient(to_bottom,#000,var(--swatch-neutral-950)_28rem,var(--swatch-neutral-950)_calc(100%_-_28rem),#000)]">
        <main className="mx-auto flex w-full max-w-[var(--home-container-wide)] gap-4 px-4 pt-16 pb-40 lg:gap-28 lg:pr-8 min-[1249px]:pl-0 min-[1024px]:max-[1248px]:pl-8">
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-24">
              <p className="mb-3 text-sm font-medium text-fd-foreground">On this page</p>
              <ul className="space-y-2 text-sm text-[color:var(--openui-text-neutral-tertiary)]">
                {SECTIONS.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`}>{section.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <h1 className="mb-2 text-[length:var(--home-title-size)] font-[family-name:var(--home-font-display)] font-medium leading-[var(--home-title-leading)] tracking-[var(--home-title-tracking)] text-[color:var(--openui-text-neutral-primary)]">
              Methodology
            </h1>
            <p className="mb-4 text-[length:var(--home-lead-size)] font-[family-name:var(--home-font-text)] leading-[var(--home-lead-leading)] text-[color:var(--openui-text-neutral-secondary)]">
              How the generative UI benchmark is run and scored.
            </p>
            <div className="-ml-3 flex flex-wrap items-center gap-1 border-b border-[color:var(--home-hairline)] pb-6">
              <PillLink href="/benchmarks" variant="ghost">
                Benchmarks
              </PillLink>
              <PillLink href="/blog/generative-ui-benchmark" variant="ghost">
                Read the full write-up
              </PillLink>
            </div>

            <article className="prose mt-8 min-w-0">
              <h2 id="how-we-ran-it">How we ran it</h2>
              <p>
                We chose 6 frontier models from various model families to test the 3 different
                Generative UI formats, OpenUI, Google A2UI and Vercel json-render.
              </p>
              <p>
                For all of these combinations we used the same catalog of 70 components, built
                entirely from OpenUI&rsquo;s public component library: the open-source chat set, six
                chat blocks from the same library, and twelve components from the public shadcn-chat
                example. The exact catalog is committed in the repo.
              </p>
              <p>
                For each format we used that SDK&rsquo;s own official prompt generator and parser,
                and gave all three the same two worked examples, so no format was hand-tuned against
                the others.
              </p>
              <p>Every model ran every prompt 4 times, giving 1,104 runs per format.</p>
              <p>
                In total 46 different prompts were used that mirror real life requests. None of them
                name a component or a layout to mimic real life user queries.
              </p>

              <h2 id="rubrics">Rubrics</h2>
              <p>For evaluation we used the following rubrics:</p>
              <ul>
                <li>
                  <strong>Completeness:</strong> a run counts as complete when everything the brief
                  asked for renders and every reference resolves, with nothing silently dropped,
                  scored per run, all-or-nothing. Higher is better.
                </li>
                <li>
                  <strong>Empty responses:</strong> whether the user saw anything at all. If the
                  response completely failed to render then we count that separately from
                  completeness. Naturally the lower the score in this rubric, the better.
                </li>
              </ul>
            </article>

            <div className="mt-12 border-t border-[color:var(--home-hairline)] pt-8">
              <GitHubButton variant="desktopGlow" />
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
