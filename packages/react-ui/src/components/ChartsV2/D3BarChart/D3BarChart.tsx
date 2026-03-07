import { D3BarChartCondensed } from "./D3BarChartCondensed";
import { D3BarChartScrollable } from "./D3BarChartScrollable";

import type { D3BarChartData, D3BarChartProps } from "./types";

export function D3BarChart<T extends D3BarChartData>(props: D3BarChartProps<T>) {
  if (props.condensed) {
    return <D3BarChartCondensed {...props} />;
  }
  return <D3BarChartScrollable {...props} />;
}
