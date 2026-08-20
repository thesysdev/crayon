import {
  BRIEFS,
  CATALOG_COMPONENTS,
  LINKS,
  MODELS,
  REFRESH_POLICY,
  RUNS_PER_FORMAT,
} from "@/lib/benchmark-data";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "../../components/PageHero/PageHero";
import { Footer } from "../../sections/Footer/Footer";
import s from "./methodology.module.css";

export const metadata: Metadata = {
  title: "Benchmark methodology | OpenUI",
  description:
    "How the OpenUI generative-UI benchmark is run and scored: the rubric with a worked example of every verdict, each SDK's own prompts and validators, every judgment call, the dispute route, and the refresh policy.",
};

/* Worked examples: one per verdict, schematic but true to the failure classes
   the scorer actually counts. The raws hold thousands of real instances —
   these exist so a reader can check the rubric without opening one. */
const VERDICTS = [
  {
    verdict: "Complete",
    example: `header = Header("Invoice #114", "Due 30 Aug")
amount = Metric("Amount due", "$1,250", currency="USD")
pay = Button("Pay now", onClickAction={action="pay"})
root = Card(children=[header, amount, pay])`,
    why: "Parses, renders a root, every reference resolves, every component is reachable from the root, required props are present, enum-typed props carry listed values — and the screen defines at least as many components as the brief has numbered requirements (the coverage floor).",
  },
  {
    verdict: "Incomplete",
    example: `header = Header("Invoice #114", "Due 30 Aug")
root = Card(children=[header, amount])   # ← "amount" is never defined`,
    why: 'The screen renders, but a reference dangles (or a defined component is orphaned, a required prop is missing, or an enum value isn\'t in the catalog — e.g. variant="success" when the component only lists "primary" | "outline"). The user sees a screen with something silently missing.',
  },
  {
    verdict: "Blank",
    example: `{"version":"v0.9","updateComponents":{"surfaceId":"main","components":[
  {"componentId":"root","component":{"Card":{"children":  ← truncated mid-document`,
    why: "The user saw nothing at all: an unparseable document, no renderable root, or an empty response. Counted separately from completion because a blank screen and a screen missing one requirement are different failures.",
  },
];

const JUDGMENT_CALLS = [
  {
    title: "Shared completeness layer (all formats)",
    body: "A run is complete when it parses, renders a root, every reference resolves, every component is reachable from root, required props are present, and enum-typed props carry listed values. A coverage floor guards against trivially small outputs: a complete screen must define at least as many components as its brief has numbered requirements.",
  },
  {
    title: "OpenUI",
    body: "lang-core's parser surfaces an inline object literal in a typed slot as an unresolved ref literally named “undefined”; when that token appears nowhere in the model's text, it is scored as the parser artifact it is, not a model failure. generatePrompt hardcodes a Stack(...) positional-args example the catalog does not contain; the prompt swaps it to Card(...).",
  },
  {
    title: "json-render",
    body: "Fenced output is accepted, and children/visible are defaulted before their strict Zod gate, because the shipped runtime renders both (the same two leniencies as the MDMA benchmark this method builds on). Their strict gate validates props as an untyped record for multi-component catalogs, so the shared layer supplies the enum and required-prop checks. Where a component's single ref-typed prop is absent but the element carries json-render's native top-level children array, the children are credited to that slot.",
  },
  {
    title: "A2UI",
    body: "The SDK scorer's full-payload validation errors are consumed into the verdict even when parsing succeeded, so they cannot vanish. The shipped @a2ui/web_core renderer gate (validate-all-then-apply per message) decides renderability; a separate counterfactual script reports the conservative blank count — runs that stay blank even when every component is rendered individually with the all-or-nothing rule removed.",
  },
  {
    title: "Empty responses and API errors",
    body: "Empty responses are scored as blanks, including the two OpenUI runs where a provider-side filter intermittently returned nothing for the disaster-response brief. API errors are retried and resumed at generation time; no failed API call is scored as a model failure.",
  },
];

export default function MethodologyPage() {
  return (
    <>
      <main className={s.page}>
        <PageHero
          eyebrow={<Link href="/benchmarks">← Benchmarks</Link>}
          title="Methodology"
          subtitle="Everything needed to check or extend the numbers — and the route to dispute them."
          smallSubtitle
        />

        <div className={s.column}>
          <section className={s.block}>
            <h2>The setup</h2>
            <p>
              {BRIEFS} screen briefs in five size bands (2 to 18 numbered requirements), none naming
              a component or layout, against one shared {CATALOG_COMPONENTS}-component catalog
              derived from OpenUI&rsquo;s public component library. {MODELS.length} models, one seat
              per company, under one uniform condition: 4 generations per brief, temperature 0.7
              (Anthropic runs its model default; the API rejects setting it), minimal reasoning, a
              16,384-token output ceiling — {RUNS_PER_FORMAT.toLocaleString()} scored runs per
              format.
            </p>
            <p>
              Each format is prompted and judged by its own SDK. OpenUI through{" "}
              <code>generatePrompt</code> with its official options (component groups, two rules,
              two worked examples); json-render through <code>catalog.prompt()</code> with three
              custom rules; A2UI through its agent SDK&rsquo;s generator as-is. The
              competitors&rsquo; official options got no worked examples — an asymmetry we plan to
              close in a follow-up, and we expect it to raise their scores.
            </p>
          </section>

          <section className={s.block}>
            <h2>The rubric, one worked example per verdict</h2>
            <p>
              Every run gets exactly one completion verdict and one renderability verdict. The
              examples below are schematic — the{" "}
              <a href={LINKS.rawOutputs} target="_blank" rel="noopener noreferrer">
                committed raws
              </a>{" "}
              hold thousands of real instances of each.
            </p>
            <div className={s.verdicts}>
              {VERDICTS.map((v) => (
                <div key={v.verdict} className={s.verdict}>
                  <h3>{v.verdict}</h3>
                  <pre>
                    <code>{v.example}</code>
                  </pre>
                  <p>{v.why}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={s.block}>
            <h2>Judgment calls</h2>
            <p>Everything that is not the SDKs&rsquo; own shipped code, disclosed in one place:</p>
            <ul className={s.calls}>
              {JUDGMENT_CALLS.map((c) => (
                <li key={c.title}>
                  <strong>{c.title}.</strong> {c.body}
                </li>
              ))}
            </ul>
          </section>

          <section className={s.block}>
            <h2>Reproduce it</h2>
            <p>
              The scorer replays every committed raw through the validators offline — no API keys —
              and rewrites the results files, so a diff against the committed results is the
              integrity check. Generation itself is idempotent and resumable. The method builds on
              Mobile Reality&rsquo;s MDMA benchmark; all three SDK versions are pinned.
            </p>
            <ul className={s.linkList}>
              <li>
                <a href={LINKS.harness} target="_blank" rel="noopener noreferrer">
                  Harness, scoring code and prompts
                </a>{" "}
                — <code>benchmarks/openui-bench</code>
              </li>
              <li>
                <a href={LINKS.briefs} target="_blank" rel="noopener noreferrer">
                  The {BRIEFS} briefs
                </a>{" "}
                and{" "}
                <a href={LINKS.catalog} target="_blank" rel="noopener noreferrer">
                  the shared catalog
                </a>
              </li>
              <li>
                <a href={LINKS.rawOutputs} target="_blank" rel="noopener noreferrer">
                  Every raw model output
                </a>{" "}
                and{" "}
                <a href={LINKS.rawData} target="_blank" rel="noopener noreferrer">
                  scored verdicts per run
                </a>
              </li>
              <li>
                <a href={LINKS.speedHarness} target="_blank" rel="noopener noreferrer">
                  The earlier token-efficiency benchmark
                </a>{" "}
                — <code>benchmarks/</code>
              </li>
            </ul>
          </section>

          <section className={s.block}>
            <h2>Disputes</h2>
            <p>
              Think a verdict is wrong?{" "}
              <a href={LINKS.dispute} target="_blank" rel="noopener noreferrer">
                Open an issue
              </a>{" "}
              naming the run (
              <code>&lt;model&gt;/&lt;format&gt;__&lt;brief&gt;__r&lt;repeat&gt;</code>). The raw
              file is the evidence; the scorer is deterministic, so a dispute either changes the
              scoring code — and re-runs every number on the site — or it doesn&rsquo;t.
            </p>
          </section>

          <section className={`${s.block} ${s.last}`}>
            <h2>Refresh policy</h2>
            <p>{REFRESH_POLICY}</p>
            <p>
              We built OpenUI. Read all of this as a first-party benchmark with everything disclosed
              — including that the shared catalog is derived from our own public component library.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
