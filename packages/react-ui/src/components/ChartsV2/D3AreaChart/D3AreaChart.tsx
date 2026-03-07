import clsx from "clsx";

import { D3AreaChartCondensed } from "./D3AreaChartCondensed";
import { D3AreaChartScrollable } from "./D3AreaChartScrollable";

import type { D3AreaChartData, D3AreaChartProps } from "./types";

export function D3AreaChart<T extends D3AreaChartData>(props: D3AreaChartProps<T>) {
  if (!props.data || props.data.length === 0) {
    return (
      <div
        className={clsx("openui-d3-area-chart-container openui-d3-chart-empty", props.className)}
      >
        <span className="openui-d3-chart-empty-text">No data available</span>
      </div>
    );
  }
  if (props.condensed) {
    return <D3AreaChartCondensed {...props} />;
  }
  return <D3AreaChartScrollable {...props} />;
}
