import { D3AreaChartCondensed } from "./D3AreaChartCondensed";
import { D3AreaChartScrollable } from "./D3AreaChartScrollable";

import type { D3AreaChartData, D3AreaChartProps } from "./types";

export function D3AreaChart<T extends D3AreaChartData>(props: D3AreaChartProps<T>) {
  if (props.condensed) {
    return <D3AreaChartCondensed {...props} />;
  }
  return <D3AreaChartScrollable {...props} />;
}
