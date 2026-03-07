import { D3LineChartCondensed } from "./D3LineChartCondensed";
import { D3LineChartScrollable } from "./D3LineChartScrollable";

import type { D3LineChartData, D3LineChartProps } from "./types";

export function D3LineChart<T extends D3LineChartData>(props: D3LineChartProps<T>) {
  if (props.condensed) {
    return <D3LineChartCondensed {...props} />;
  }
  return <D3LineChartScrollable {...props} />;
}
