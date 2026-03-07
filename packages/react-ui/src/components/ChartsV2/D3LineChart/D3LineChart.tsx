import clsx from "clsx";

import { D3LineChartCondensed } from "./D3LineChartCondensed";
import { D3LineChartScrollable } from "./D3LineChartScrollable";

import type { D3LineChartData, D3LineChartProps } from "./types";

export function D3LineChart<T extends D3LineChartData>(props: D3LineChartProps<T>) {
  if (!props.data || props.data.length === 0) {
    return (
      <div
        className={clsx("openui-d3-line-chart-container openui-d3-chart-empty", props.className)}
      >
        <span className="openui-d3-chart-empty-text">No data available</span>
      </div>
    );
  }
  if (props.condensed) {
    return <D3LineChartCondensed {...props} />;
  }
  return <D3LineChartScrollable {...props} />;
}
