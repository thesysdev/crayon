import clsx from "clsx";

import { D3BarChartCondensed } from "./D3BarChartCondensed";
import { D3BarChartScrollable } from "./D3BarChartScrollable";

import type { D3BarChartData, D3BarChartProps } from "./types";

export function D3BarChart<T extends D3BarChartData>(props: D3BarChartProps<T>) {
  if (!props.data || props.data.length === 0) {
    return (
      <div className={clsx("openui-d3-bar-chart-container openui-d3-chart-empty", props.className)}>
        <span className="openui-d3-chart-empty-text">No data available</span>
      </div>
    );
  }
  if (props.condensed) {
    return <D3BarChartCondensed {...props} />;
  }
  return <D3BarChartScrollable {...props} />;
}
