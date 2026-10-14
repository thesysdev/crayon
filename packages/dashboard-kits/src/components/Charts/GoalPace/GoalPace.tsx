import clsx from "clsx";
import { formatPercent } from "../../../core/format";
import { RollingNumber } from "../../RollingNumber";
import { KIT_CHART_PREFIX } from "../utils/constants";
import { formatValue } from "../utils/format";
import { goalStatus } from "./goalGeometry";
import { GoalGauge } from "./parts/GoalGauge";
import { PaceChart } from "./parts/PaceChart";
import type { GoalPaceProps } from "./types";

const P = `${KIT_CHART_PREFIX}-goal-pace`;
const STATUS_CLASS = { good: "positive", warn: "warning", bad: "negative" } as const;

/**
 * Progress toward a goal for a calendar period: a gauge of the share reached
 * with a tick where the pace says it should be, whether the period is on pace
 * and where it is projected to finish, what each remaining day needs, and the
 * running total against the pace line.
 */
export function GoalPace(props: GoalPaceProps) {
  const g = props.goal;
  if (g.labels.length === 0 || g.cumulative.length === 0 || !(g.goal > 0)) {
    return (
      <div className={clsx(`${P} ${P}--empty`, props.className)}>
        <span className={`${P}-empty-text`}>No goal set for this period</span>
      </div>
    );
  }
  return <GoalPaceImpl {...props} />;
}

function GoalPaceImpl({ goal: g, className }: GoalPaceProps) {
  const format = g.format ?? "number";
  const status = goalStatus(g);
  const finish = formatPercent(status.projected / g.goal, 0);
  return (
    <div className={clsx(P, className)}>
      <div className={`${P}-head`}>
        <GoalGauge
          reached={status.reached}
          expected={status.expected}
          tone={status.tone}
          label={`${formatPercent(status.reached, 0)} of ${formatValue(g.goal, format)} reached`}
        />
        <div className={`${P}-summary`}>
          <span className={`${P}-label`}>{g.label}</span>
          <span className={`${P}-value`}>
            <RollingNumber value={formatValue(status.actual, format)} />
            <span className="kit-muted"> of {formatValue(g.goal, format)}</span>
          </span>
          <span className={`kit-status kit-status--${STATUS_CLASS[status.tone]}`}>
            <i className="kit-status__dot" />
            {status.onPace
              ? `On pace for ${finish} of goal`
              : `Behind pace · on track for ${finish}`}
          </span>
        </div>
      </div>
      <dl className={`${P}-stats`}>
        <div>
          <dt>Projected</dt>
          <dd>{formatValue(status.projected, format)}</dd>
        </div>
        <div>
          <dt>Needed per day</dt>
          <dd>{status.neededPerDay != null ? formatValue(status.neededPerDay, format) : "—"}</dd>
        </div>
        <div>
          <dt>Days left</dt>
          <dd>{status.total - status.elapsed}</dd>
        </div>
      </dl>
      <PaceChart goal={g} status={status} format={format} />
    </div>
  );
}
