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
  tokens,
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
      tight
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
              const vals = FORMAT_ORDER.map((id) => completionByModel[m.id][id]);
              const best = Math.max(...vals);
              return (
                <tr key={m.id}>
                  <th scope="row">
                    <span className={s.model}>
                      {m.label}
                      <span className={s.vendor}>{m.vendor}</span>
                    </span>
                  </th>
                  {FORMAT_ORDER.map((id) => {
                    const isBest = completionByModel[m.id][id] === best;
                    return (
                      <td key={id} className={slotClass(slotOf(id))}>
                        {isBest ? (
                          <span className={s.best}>{completionByModel[m.id][id].toFixed(1)}</span>
                        ) : (
                          completionByModel[m.id][id].toFixed(1)
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            <tr className={s.avgRow}>
              <th scope="row">Average</th>
              {FORMAT_ORDER.map((id) => {
                const means = FORMAT_ORDER.map((f) => completionMean(f));
                const best = Math.max(...means);
                return (
                  <td key={id} className={slotClass(slotOf(id))}>
                    {completionMean(id) === best ? (
                      <span className={s.best}>{completionMean(id).toFixed(1)}</span>
                    ) : (
                      completionMean(id).toFixed(1)
                    )}
                  </td>
                );
              })}
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
      note={<>Out of {RUNS_PER_FORMAT.toLocaleString()} runs per format. OpenUI&rsquo;s single blank is a zero-byte model response; A2UI&rsquo;s count is its shipped renderer dropping whole messages on any invalid component.</>}
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
          System prompts from each SDK&rsquo;s own generator over the same 70-component
          catalog; output is the mean over all{" "}
          {tokens.outputBasis.runs.toLocaleString()} scored runs across the six models.
          tiktoken o200k on the exact prompts and outputs.
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
          One pass = {BRIEFS}{" "} screens at list prices; the five models with public
          per-token pricing. Gap = dearest / cheapest. Per 1,000 screens on Opus:
          $49 in OpenUI Lang against $127 in A2UI and $106 in json-render.
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

