import { Footer } from "@/app/(home)/sections/Footer/Footer";
import { BENCHMARK_CANONICAL_URL, BENCHMARK_UPDATED_ISO } from "@/lib/benchmark-agent-data";
import {
  BENCHMARK_REPOSITORY,
  BRIEFS,
  CATALOG_COMPONENTS,
  FORMATS,
  LINKS,
  MODELS,
  PUBLISHED_SCORER_TAG,
  RUNS_PER_FORMAT,
  RUNS_TOTAL,
} from "@/lib/benchmark-data";
import type { Metadata } from "next";
import { PillLink } from "../../components/Button/Button";

export const metadata: Metadata = {
  title: "Benchmark methodology | OpenUI",
  description:
    "The reproducible methodology for the OpenUI generative UI benchmark: 46 briefs, 70 equivalent components, controlled generation settings, SDK-native validation, and scorer versioning.",
  alternates: { canonical: "/benchmarks/methodology" },
  openGraph: {
    type: "article",
    url: "/benchmarks/methodology",
    title: "Generative UI benchmark methodology | OpenUI",
    description:
      "How the language/model and framework benchmarks are generated, scored, versioned, and reproduced.",
    modifiedTime: "2026-08-26",
  },
};

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "briefs-and-catalog", label: "Briefs and catalog" },
  { id: "generation-condition", label: "Generation condition" },
  { id: "prompts-and-formats", label: "Prompts and formats" },
  { id: "scoring", label: "Scoring" },
  { id: "reproduce", label: "Reproduce the scores" },
  { id: "versions", label: "Scorer versions" },
  { id: "limitations", label: "Limitations" },
] as const;

const structuredData = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "@id": `${BENCHMARK_CANONICAL_URL}/methodology#article`,
  headline: "Generative UI benchmark methodology",
  description:
    "Generation, scoring, reproduction, and versioning methodology for the OpenUI generative UI benchmark.",
  url: `${BENCHMARK_CANONICAL_URL}/methodology`,
  dateModified: "2026-08-26",
  author: { "@type": "Organization", name: "OpenUI by Thesys" },
  isPartOf: { "@id": `${BENCHMARK_CANONICAL_URL}#dataset` },
  codeRepository: BENCHMARK_REPOSITORY,
};

export default function BenchmarkMethodologyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c"),
        }}
      />
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
            <p className="mb-4 max-w-3xl text-[length:var(--home-lead-size)] font-[family-name:var(--home-font-text)] leading-[var(--home-lead-leading)] text-[color:var(--openui-text-neutral-secondary)]">
              How the language/model and framework benchmarks are generated, scored, versioned, and
              reproduced.
            </p>
            <nav
              aria-label="Benchmark pages"
              className="-ml-3 flex flex-wrap items-center gap-1 border-b border-[color:var(--home-hairline)] pb-6"
            >
              <PillLink href="/benchmarks" variant="ghost">
                Benchmark overview
              </PillLink>
              <PillLink href="/benchmarks/language" variant="ghost">
                Language/model results
              </PillLink>
              <PillLink href="/benchmarks/framework" variant="ghost">
                Framework results
              </PillLink>
              <PillLink href={BENCHMARK_REPOSITORY} variant="ghost" external>
                Source repository
              </PillLink>
            </nav>

            <article className="prose mt-8 min-w-0 max-w-none">
              <section id="overview" aria-labelledby="overview-heading">
                <h2 id="overview-heading">Overview</h2>
                <p>
                  The benchmark asks how reliably current models generate working user interfaces.
                  It uses one shared {CATALOG_COMPONENTS}-component surface, {BRIEFS} frozen screen
                  briefs, four generations per brief, and three generative UI formats: OpenUI Lang,
                  Google A2UI v0.9, and Vercel json-render 0.19.
                </p>
                <p>
                  The <a href="/benchmarks/language">language/model benchmark</a> compares OpenUI
                  output across models. The <a href="/benchmarks/framework">framework benchmark</a>
                  compares {FORMATS.length} formats across {MODELS.length} models, with{" "}
                  {RUNS_PER_FORMAT.toLocaleString("en-US")} runs per format and{" "}
                  {RUNS_TOTAL.toLocaleString("en-US")} scored runs in total.
                </p>
              </section>

              <section id="briefs-and-catalog" aria-labelledby="briefs-and-catalog-heading">
                <h2 id="briefs-and-catalog-heading">Briefs and component catalog</h2>
                <p>
                  The {BRIEFS} briefs cover five size bands, from small two-requirement screens to
                  dense screens with up to eighteen numbered requirements. Requirements describe
                  content and intent but do not name components or prescribe layout. This leaves
                  component choice and composition to the model.
                </p>
                <p>
                  Every format receives a protocol-specific catalog derived from one public
                  reference surface of {CATALOG_COMPONENTS} components. A committed parity check
                  verifies that the OpenUI, A2UI, and json-render catalogs remain equivalent to that
                  reference rather than silently testing different UI capabilities.
                </p>
                <ul>
                  <li>
                    <a href={LINKS.briefs}>Frozen briefs used for the published website results</a>
                  </li>
                  <li>
                    <a href={LINKS.catalog}>Shared public component catalog</a>
                  </li>
                </ul>
              </section>

              <section id="generation-condition" aria-labelledby="generation-condition-heading">
                <h2 id="generation-condition-heading">Generation condition</h2>
                <p>The published condition is uniform wherever the provider permits it:</p>
                <ul>
                  <li>Four generations per brief.</li>
                  <li>A 16,384-token output ceiling.</li>
                  <li>Temperature 0.7.</li>
                  <li>Minimal or no model reasoning.</li>
                </ul>
                <p>
                  Anthropic runs use the model&rsquo;s default temperature because the tested API
                  rejects an explicit temperature for that model. OpenAI reasoning runs omit the
                  non-default temperature when the API requires it. Those provider exceptions are
                  recorded rather than silently normalized.
                </p>
                <p>
                  Network and provider failures are retried during generation and are not scored as
                  model failures. An empty response returned successfully by the model is a blank
                  generation and is scored. Raw writes are idempotent, so an interrupted run resumes
                  without regenerating completed outputs.
                </p>
              </section>

              <section id="prompts-and-formats" aria-labelledby="prompts-and-formats-heading">
                <h2 id="prompts-and-formats-heading">Prompts and format parity</h2>
                <p>
                  Each format uses the system prompt produced by its own SDK rather than a
                  benchmark-authored imitation. All three prompts carry the same two worked
                  examples. The user message is the same brief in every format.
                </p>
                <p>
                  OpenUI uses its official library prompt generator; json-render uses its catalog
                  prompt and stream format; A2UI uses its generated v0.9 system prompt. This keeps
                  each format close to the way its maintainers intend models to use it while the
                  catalog and task stay controlled.
                </p>
              </section>

              <section id="scoring" aria-labelledby="scoring-heading">
                <h2 id="scoring-heading">Scoring</h2>
                <p>
                  Scoring is offline. Every committed raw output can be replayed through the pinned
                  validators without model API keys. Each protocol first uses its own shipped
                  parser, compiler, renderer gate, or catalog validator. One shared completeness
                  layer then applies the same structural requirements to all three formats.
                </p>
                <h3>Structural validity</h3>
                <p>A generation is structurally valid only when it:</p>
                <ul>
                  <li>parses successfully and produces a root;</li>
                  <li>resolves every component reference;</li>
                  <li>keeps every declared component reachable from the root;</li>
                  <li>uses known component types;</li>
                  <li>passes required-prop and enum checks;</li>
                  <li>does not hit the recorded output ceiling; and</li>
                  <li>
                    contains at least as many reachable components as the brief has numbered
                    requirements.
                  </li>
                </ul>
                <p>
                  That final coverage floor prevents a trivially small but syntactically valid
                  screen from passing. It is a count floor, not a semantic judgment that every
                  requirement was fulfilled.
                </p>
                <h3>Render success</h3>
                <p>
                  Render success records whether the format&rsquo;s shipped rendering path produced
                  a non-blank rooted screen. It is measured separately from structural validity: a
                  screen can render something while still containing dangling references, invalid
                  props, or incomplete structure.
                </p>
              </section>

              <section id="reproduce" aria-labelledby="reproduce-heading">
                <h2 id="reproduce-heading">Reproduce the scores</h2>
                <p>
                  The current source repository requires Node 22.18 or newer and pins{" "}
                  <code>@openuidev/lang-core</code> exactly. A2UI scoring also needs the official
                  Python SDK at the repository&rsquo;s pinned revision.
                </p>
                <pre className="max-w-full overflow-x-auto">
                  <code>{`npm install

python3 -m venv .venv
.venv/bin/pip install antlr4-tools
.venv/bin/pip install "a2ui-agent-sdk @ git+https://github.com/a2ui-project/a2ui@29b715fa89fc5bb8351d2ea0116f03d4f2e212f2#subdirectory=agent_sdks/python/a2ui_agent"

A2UI_PYTHON=.venv/bin/python node score.ts
A2UI_PYTHON=.venv/bin/python node score.ts gemini`}</code>
                </pre>
                <p>
                  The scorer rewrites the committed result files from raw outputs alone. A clean
                  diff against the committed results is the integrity check. Token and cost tables
                  can be regenerated with <code>node tools/count-tokens.ts</code> and{" "}
                  <code>node tools/cost-estimate.ts</code>.
                </p>
                <ul>
                  <li>
                    <a href={LINKS.harness}>Published website scorer and data</a>
                  </li>
                  <li>
                    <a href={LINKS.latestHarness}>Latest benchmark harness</a>
                  </li>
                </ul>
              </section>

              <section id="versions" aria-labelledby="versions-heading">
                <h2 id="versions-heading">Scorer versions and comparability</h2>
                <p>
                  The values currently published on this website were scored under{" "}
                  <code>lang-core 0.2.11</code>. That exact state is preserved in the repository tag{" "}
                  <a href={LINKS.harness}>{PUBLISHED_SCORER_TAG}</a>.
                </p>
                <p>
                  The latest repository defaults to <code>lang-core 0.2.15</code> and contains
                  rescored verdicts. The 0.2.11 and 0.2.15 results are different scorer regimes and
                  must not be compared row by row. A future website data refresh should update the
                  displayed results, data endpoints, version label, and changelog together.
                </p>
              </section>

              <section id="limitations" aria-labelledby="limitations-heading">
                <h2 id="limitations-heading">Limitations and disclosures</h2>
                <ul>
                  <li>
                    OpenUI built and maintains this first-party benchmark. The raw outputs, scorer,
                    catalogs, and rules are published so readers can inspect or dispute the method.
                  </li>
                  <li>
                    The component-count floor measures minimum structural coverage, not visual
                    quality or semantic satisfaction of every requirement.
                  </li>
                  <li>
                    Cost uses measured tokens and provider list prices. Hidden reasoning tokens are
                    not present in raw text, so billed cost can be higher for thinking models.
                  </li>
                  <li>
                    Self-hosted models have no directly comparable API list price; their cost is
                    represented as null, not zero.
                  </li>
                  <li>
                    Provider routing, serving hardware, and model revisions can affect results even
                    when the harness is unchanged.
                  </li>
                  <li>
                    The benchmark measures generation against one shared 70-component catalog. It
                    does not represent every possible UI library or application domain.
                  </li>
                </ul>
              </section>
            </article>

            <div className="mt-12 border-t border-[color:var(--home-hairline)] pt-8 text-sm text-[color:var(--openui-text-neutral-secondary)]">
              Methodology source of record: <a href={LINKS.latestReadme}>generative-ui-bench</a>.
              Website benchmark data last published {BENCHMARK_UPDATED_ISO}.
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
