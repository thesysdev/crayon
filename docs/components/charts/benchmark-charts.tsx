import {
  BRIEFS,
  COST_MODELS,
  FORMATS,
  FORMAT_ORDER,
  type FormatId,
  MODELS,
  RUNS_PER_FORMAT,
  blankScreens,
  completionByModel,
  completionMean,
  costPerPass,
  formatLabel,
  repairFunnel,
  repairShare,
  repairedShare,
  tokens,
  winnerFor,
} from "@/lib/benchmark-data";
import { Chart, Mark, Row, slotClass, styles as s } from "./primitives";

const slotOf = (id: FormatId) => FORMATS.find((f) => f.id === id)!.series;
const markOf = (id: FormatId) => FORMATS.find((f) => f.id === id)!.mark;
const usd = (n: number) => `$${n.toFixed(2)}`;

/* 1 ─ completion, model by model: the table --------------------------- */

export function CompletionByModel() {
  return (
    <Chart
      title="Completion rate by model"
      sub="How often a screen came back with everything the brief asked for. Three of six models do their best work in OpenUI Lang; the other three don't."
      tight
      note={
        <>
          {BRIEFS} briefs · {RUNS_PER_FORMAT.toLocaleString()} runs per format, 184–460
          per cell. Kimi ran a 16k output ceiling against 8k elsewhere; gaps under ~3
          points are noise.
        </>
      }
    >
      <div className={s.tableWrap}>
        <table className={`${s.table} ${s.tableWide}`}>
          <thead>
            <tr>
              <th scope="col">Model</th>
              {FORMATS.map((f) => (
                <th key={f.id} scope="col" className={slotClass(f.series)}>
                  <span className={s.colHead}>
                    <Mark id={f.mark} />
                    {f.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODELS.map((m) => {
              const best = winnerFor(m.id);
              return (
                <tr key={m.id}>
                  <th scope="row">
                    <span className={s.model}>
                      {m.label}
                      <span className={s.vendor}>{m.vendor}</span>
                    </span>
                  </th>
                  {FORMAT_ORDER.map((id) => (
                    <td key={id} className={slotClass(slotOf(id))}>
                      {id === best ? (
                        <span className={s.best}>{completionByModel[m.id][id].toFixed(1)}</span>
                      ) : (
                        completionByModel[m.id][id].toFixed(1)
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
            <tr className={s.avgRow}>
              <th scope="row">Average</th>
              {FORMAT_ORDER.map((id) => (
                <td key={id}>{completionMean(id).toFixed(1)}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Chart>
  );
}

/* 2 ─ blank screens --------------------------------------------------- */

export function BlankScreens() {
  const worst = Math.max(...FORMAT_ORDER.map((id) => blankScreens[id]));
  const fewest = Math.min(...FORMAT_ORDER.map((id) => blankScreens[id]));
  return (
    <Chart
      title="Fully blank screens"
      sub="Runs where the user saw nothing at all. A broken OpenUI line costs you that line; a broken JSON document costs you the screen."
      note={<>Out of {RUNS_PER_FORMAT.toLocaleString()} runs per format, counting only payloads whose JSON fails to parse.</>}
    >
      <div className={s.rows}>
        {FORMAT_ORDER.map((id) => (
          <Row key={id} label={formatLabel(id)} mark={markOf(id)}>
            <span
              className={`${s.bar} ${slotClass(slotOf(id))}`}
              style={{ width: `${(blankScreens[id] / worst) * 72}%`, background: "var(--c)" }}
            />
            <span className={`${s.value} ${blankScreens[id] === fewest ? `${s.valueHi} ${slotClass(slotOf(id))}` : ""}`}>
              {blankScreens[id]} / {((blankScreens[id] / RUNS_PER_FORMAT) * 100).toFixed(2)}%
            </span>
          </Row>
        ))}
      </div>
    </Chart>
  );
}

/* 3 ─ tokens: system prompt and output, side by side ----------------- */

function TokenGroup({
  heading,
  suffix,
  data,
  baseline,
}: {
  heading: string;
  suffix: string;
  data: Record<FormatId, number>;
  baseline: number;
}) {
  const max = Math.max(...FORMAT_ORDER.map((id) => data[id]));
  return (
    <div className={s.rows}>
      <p className={s.groupHead}>
        {heading} <span>· {suffix}</span>
      </p>
      {FORMAT_ORDER.map((id) => {
        const multiple = data[id] / baseline;
        return (
          <Row key={id} label={formatLabel(id)} mark={markOf(id)}>
            <span
              className={`${s.bar} ${slotClass(slotOf(id))}`}
              style={{ width: `${(data[id] / max) * 68}%`, background: "var(--c)" }}
            />
            <span className={`${s.value} ${id === "openui" ? `${s.valueHi} ${slotClass(slotOf(id))}` : ""}`}>
              {data[id].toLocaleString()}
              {id === "openui" ? "" : ` · ${multiple.toFixed(1)}x`}
            </span>
          </Row>
        );
      })}
    </div>
  );
}

export function TokenOverhead() {
  return (
    <Chart
      title="Token cost per screen"
      sub="You pay twice: the system prompt rides on every request, then the model writes the screen. OpenUI Lang is the smallest on both."
      note={
        <>
          System prompts from each SDK&rsquo;s own generator over the same 73-component
          catalog; output is the mean over Gemini&rsquo;s {tokens.outputBasis.runs}{" "}
          generations. tiktoken o200k on the exact prompts and outputs.
        </>
      }
    >
      <TokenGroup
        heading="System prompt"
        suffix="tokens on every request"
        data={tokens.systemPrompt}
        baseline={tokens.systemPrompt.openui}
      />
      <TokenGroup
        heading="Model output"
        suffix="mean tokens per screen"
        data={tokens.outputPerScreen}
        baseline={tokens.outputPerScreen.openui}
      />
    </Chart>
  );
}

/* 4 ─ cost: the table ------------------------------------------------- */

export function CostPerPass() {
  return (
    <Chart
      title="Cost of one benchmark pass"
      sub="What the same 46 screens cost in each format, at list prices. Cheapest in each row is highlighted."
      tight
      note={
        <>
          One pass = {BRIEFS}{" "} screens at list prices; the four models with public
          per-token pricing. Gap = dearest / cheapest. Per 1,000 screens on Opus:
          $39 in OpenUI Lang against $94 and $122.
        </>
      }
    >
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col">Model</th>
              {FORMATS.map((f) => (
                <th key={f.id} scope="col" className={slotClass(f.series)}>
                  <span className={s.colHead}>
                    <Mark id={f.mark} />
                    {f.label}
                  </span>
                </th>
              ))}
              <th scope="col">Gap</th>
            </tr>
          </thead>
          <tbody>
            {COST_MODELS.map((m) => {
              const model = MODELS.find((x) => x.id === m)!;
              const vals = FORMAT_ORDER.map((id) => costPerPass[m]![id]);
              const min = Math.min(...vals);
              const max = Math.max(...vals);
              return (
                <tr key={m}>
                  <th scope="row">
                    <span className={s.model}>
                      {model.label}
                      <span className={s.vendor}>{model.vendor}</span>
                    </span>
                  </th>
                  {FORMAT_ORDER.map((id) => (
                    <td key={id} className={slotClass(slotOf(id))}>
                      {costPerPass[m]![id] === min ? (
                        <span className={s.best}>{usd(costPerPass[m]![id])}</span>
                      ) : (
                        usd(costPerPass[m]![id])
                      )}
                    </td>
                  ))}
                  <td>{(max / min).toFixed(1)}x</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Chart>
  );
}

/* 5 ─ repair funnel: rows plus the per-stage detail from the original --- */

const STAGE_DETAIL: Record<string, string> = {
  rules: "Drop orphans, snap near-miss enums, trim extra arguments. No added wait.",
  llm: "The parser's exact error goes back to a small model that patches the output.",
  fellThrough: "Mostly orphans and truncation.",
};

export function RepairFunnel() {
  const fills = [
    "var(--c1)",
    "color-mix(in srgb, var(--c1) 45%, var(--surface))",
    "color-mix(in srgb, var(--ink) 20%, var(--surface))",
  ];
  const max = Math.max(...repairFunnel.stages.map((st) => st.count));
  return (
    <Chart
      title="Repair outcomes for failed generations"
      sub={`What it took to fix the ${repairFunnel.failed} generations that failed validation in a recent production window.`}
      note="Most repairs are rule-based and add no LLM latency; the single-pass retry receives the parser's exact error."
    >
      <div className={s.rows}>
        {repairFunnel.stages.map((st, i) => (
          <div key={st.id} className={s.row}>
            <span className={s.rowName} style={{ width: 232 }}>
              <span className={s.rowLabel}>{st.label}</span>
            </span>
            <span className={s.rowBody}>
              <span className={s.bar} style={{ width: `${(st.count / max) * 68}%`, background: fills[i] }} />
              <span className={s.value}>
                {repairShare(st.count).toFixed(0)}% · {st.count}
              </span>
            </span>
          </div>
        ))}
      </div>

      <ul className={s.stageList}>
        {repairFunnel.stages.map((st, i) => (
          <li key={st.id}>
            <span className={s.keySwatch} style={{ background: fills[i] }} aria-hidden />
            <span>
              <strong>
                {st.count} screens {st.id === "rules" ? "repaired by rules" : st.id === "llm" ? "repaired by one LLM pass" : "fell through"}.
              </strong>{" "}
              {STAGE_DETAIL[st.id]}
            </span>
          </li>
        ))}
      </ul>

      <p className={s.shipped}>
        {repairedShare().toFixed(0)}% of would-be-broken screens shipped.
      </p>
    </Chart>
  );
}
