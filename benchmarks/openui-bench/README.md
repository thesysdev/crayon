# openui-bench

Reliability benchmark for three generative-UI formats over one shared
component catalog: [OpenUI Lang](https://github.com/thesysdev/openui),
Google [A2UI](https://github.com/a2ui-project/a2ui) (v0.9), and Vercel
[json-render](https://github.com/vercel-labs/json-render) (0.19). Results are
published in the [blog post](https://thesys.dev/blog/generative-ui-benchmark);
this directory holds everything needed to check or extend them: the briefs,
the catalog, each format's prompt and validator built from its own SDK, every
raw model output, and the scored verdicts.

## Headline setup

- 46 screen briefs in 5 size bands (2 to 18 numbered requirements). None names
  a component or layout.
- 70-component catalog derived from OpenUI's public component library: the
  open-source chat set, six chat blocks from the same library, and twelve
  components from the public shadcn-chat example. `catalog/public-catalog.json`
  is the reference surface all three protocol catalogs mirror;
  `node tools/check-catalogs.mjs` verifies the three stay equivalent to it
  (names, props, required flags, enums).
- 6 models, one seat per company: GPT-5.6 Sol, Claude Opus 4.8, Kimi K3,
  Gemini 3.6 Flash, Qwen3.8 2.4T, Muse Spark 1.2. A seventh run (GPT-5.6
  Terra) is committed but excluded from the averages so OpenAI holds one seat
  like every other company.
- One uniform condition for every model and format: 4 generations per brief,
  temperature 0.7 (Anthropic runs its model default; the API rejects setting
  it), reasoning minimal/none, 16,384-token output ceiling. 1,104 scored runs
  per format. Gemini's json-render and A2UI legs were generated with 10
  repeats before the 4-rep rule was settled; the scored set is the first 4
  (fixed rule, not outcome-selected) and only those are committed.
- Each format's prompt comes from its own SDK's generator, all carrying the
  same two worked examples: OpenUI through `generatePrompt` with its official
  options (component groups, three rules, two worked examples; see
  `protocols/openui/prompt.ts`), json-render through `catalog.prompt()` with
  three custom rules plus the same two examples, A2UI through the agent SDK's
  `DirectJsonFormat` generator with the same two examples in its
  `role_description`.
- Each format's validation is its own SDK's shipped code plus one shared
  completeness layer (identical rules for all three) described under
  "Judgment calls".

## Layout

| Path | What it is |
|---|---|
| `briefs/` | The 46 briefs as data (`briefs.mjs`) and the band design (`DESIGN.md`). |
| `catalog/public-catalog.json` | The shared 70-component catalog. |
| `protocols/openui/` | catalog, prompt (lang-core `generatePrompt`), validator (lang-core parser). |
| `protocols/jsonrender/` | catalog (`defineCatalog` with Zod), prompt (`catalog.prompt()`), validator (their stream compiler, `validateSpec`, Zod gate). |
| `protocols/a2ui/` | catalog + prompt generation (official python SDK), scorer (`score.py`), renderer gate (`validator.mjs`, `@a2ui/web_core` MessageProcessor), and the generated `catalog-a2ui.json` / `system-prompt.txt` the runs consumed. Unlike the other two protocols, which generate their prompts at runtime from TypeScript, A2UI's generator needs the python SDK, so its generated artifacts are committed byte-stable. |
| `run.mjs` | Generation runner (any OpenAI-compatible provider, Anthropic, Google). |
| `score.mjs` | Offline scorer: replays every raw through the validators, no API keys needed. |
| `tools/` | Token counts, cost estimates, blank-screen floor. |
| `raw/` | Every scored model output, verbatim: `raw/<label>/<format>__<brief>__r<repeat>.txt`. |
| `results/` | Scored verdicts per model, one row per run. |

## Reproduce the scores (no API keys)

Prerequisites: Node >= 22.18 (the harness imports TypeScript modules
directly), and the monorepo's OpenUI SDK built once at the repo root, since
the openui protocol scores with the same lang-core parser the product ships:

```bash
# from the repo root
pnpm install
pnpm --filter @openuidev/lang-core build

# in benchmarks/openui-bench
npm install

# A2UI's scorer needs the official python SDK, pinned to the revision the
# benchmark ran against:
python3 -m venv .venv
.venv/bin/pip install antlr4-tools          # their build hook needs the antlr4 binary
.venv/bin/pip install "a2ui_agent @ git+https://github.com/a2ui-project/a2ui@29b715fa89fc5bb8351d2ea0116f03d4f2e212f2#subdirectory=agent_sdks/python/a2ui_agent"

A2UI_PYTHON=.venv/bin/python node score.mjs           # all models, ~15 min
A2UI_PYTHON=.venv/bin/python node score.mjs gemini    # one model
```

Without `A2UI_PYTHON`, `score.mjs` still scores the openui and json-render
rows but skips a2ui and leaves the results files untouched.

`score.mjs` rewrites `results/results-<model>.json` from the raws alone, so a
diff against the committed results is the integrity check. `raw/<label>/truncated.json`
records the generations that hit the output ceiling, the one generation-time
fact a raw file cannot carry; a label without one had no truncations.

Results-row vocabulary, for historical continuity with the committed data:
each row calls its brief `scenario`, carries a constant legacy `axis` field,
and has a `tokens` field holding generation-time output-token counts where the
original run recorded them (partially populated, openui rows only). Token
analysis uses `tools/count-tokens.mjs`, which counts the raws directly.

Token and cost tables, and the conservative A2UI blank-screen count
(`score.mjs` already prints per-format renderable counts). The cost table
covers the five models with public list prices; Sol and Terra have none:

```bash
node tools/count-tokens.mjs
node tools/cost-estimate.mjs
A2UI_PYTHON=.venv/bin/python node protocols/a2ui/counterfactual.mjs sol opus48 kimi gemini qwen muse
```

## Regenerate (API keys required)

```bash
BENCH_MODEL=google/gemini-3.6-flash BENCH_LABEL=gemini \
OPENROUTER_API_KEY=... node run.mjs openui jsonrender a2ui
```

`BENCH_PROVIDER` selects openrouter (default), openai, anthropic, or google;
each has its own key env. Raws are idempotent (existing non-empty files are
skipped), so an interrupted run resumes by re-running the same command. See
the header of `run.mjs` for every knob.

## Add a model / brief / protocol

- **Model**: pick a label, run `run.mjs` with `BENCH_MODEL`/`BENCH_LABEL`,
  then `score.mjs <label>`. No code changes.
- **Brief**: add an entry to `briefs/briefs.mjs` (name, band, reqs count,
  prompt text following `briefs/DESIGN.md`), rerun generation for the new
  brief (`BENCH_ONLY=<name>`).
- **Protocol**: one folder under `protocols/` exposing a system prompt and an
  `evaluate(text, {reqs})` verdict, wired into the `FORMATS` map in `run.mjs`
  and the dispatch in `score.mjs`. The three existing folders are the
  reference implementations.

## Judgment calls

Everything that is not the SDKs' own code, in one place:

- **Shared completeness layer** (all formats): a run is complete when it
  parses, renders a root, every reference resolves, every component is
  reachable from root, required props are present, and enum-typed props carry
  listed values. A **coverage floor** guards against trivially small outputs:
  a complete screen must define at least as many components as its brief has
  numbered requirements.
- **openui**: lang-core's parser surfaces an inline object literal in a typed
  slot as an unresolved ref literally named `undefined`; when the token
  `undefined` appears nowhere in the text this is scored as the parser
  artifact it is, not a model failure. `generatePrompt` hardcodes a
  `Stack(...)` positional-args example the catalog does not contain; the
  prompt swaps it to `Card(...)` (see `fixStackExample`).
- **json-render**: fenced output is accepted, and `children`/`visible` are
  defaulted before their strict Zod gate, because the shipped runtime renders
  both (same two leniencies as the MDMA benchmark). Their strict gate
  validates props as an untyped record for multi-component catalogs, so the
  shared layer supplies the enum/required checks. Where a component's single
  ref-typed prop is absent but the element carries json-render's native
  top-level `children` array, children are credited to that slot (leniency
  toward their idiom).
- **A2UI**: the SDK scorer's full-payload validation errors are consumed into
  the verdict even when parsing succeeded, so they cannot vanish. The shipped
  `@a2ui/web_core` renderer gate (validate-all-then-apply per message) decides
  renderability; `protocols/a2ui/counterfactual.mjs` reports the conservative
  count, runs that stay blank even when every component is rendered
  individually with the all-or-nothing rule removed.
- **Empty responses**: scored as blanks (renderable=false), including the one
  openui run (Qwen, on the streaming brief) that returned an empty response.
- **API errors**: retried and resumed at generation time; no failed API call
  is scored as a model failure.

## Lineage

The method builds on Mobile Reality's
[MDMA benchmark](https://github.com/MobileReality/mdma); the shared-layer
leniencies for json-render match theirs. SDK versions: the npm packages
(`@json-render/core`, `@a2ui/web_core`) are pinned by the committed
`package-lock.json`, the A2UI python SDK by the commit in the install command
above, and OpenUI's lang-core is this repository at the same commit as the
benchmark itself. The A2UI catalog id and title embedded in the raws' prompts
are kept verbatim so the committed raws stay reproducible. The files under
`raw/` are verbatim large-language-model outputs generated for this benchmark
and are published here as its data record.

